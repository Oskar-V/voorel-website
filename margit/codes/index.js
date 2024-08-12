document.getElementById('process-files-button').addEventListener('click', processFiles);

const PRIMARY_CODE_PATTERN = /(?:[^\w]|^|_\/)([A-Z]{3}\d{3})(?=[^\w]|$|_)/g;
const SECONDARY_CODE_PATTERN = /(?:[^\w]|^|_|\/)([A-Z]{4}\d{2,3}|[A-Z]{2}\d{6}|[A-Z]{2}\d{4})(?=[^\w]|$|_)/g;

// const primary_code_pattern_input = document.getElementById('primary-code-pattern');
// const secondary_code_pattern_input = document.getElementById('secondary-code-pattern');

// primary_code_pattern_input.value = PRIMARY_CODE_PATTERN;
// secondary_code_pattern_input.value = SECONDARY_CODE_PATTERN;

document.addEventListener('drop', (ev) => {
	const fileInput = document.getElementById('file-input');

	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();

	// Create a DataTransfer object to hold the files
	const dataTransfer = new DataTransfer();

	if (ev.dataTransfer.items) {
		// Use DataTransferItemList interface to access the file(s)
		[...ev.dataTransfer.items].forEach((item) => {
			// If dropped items aren't files, reject them
			if (item.kind === "file") {
				const file = item.getAsFile();
				if (file && file.name.endsWith('.csv')) {
					dataTransfer.items.add(file);
					console.log(`Adding ${file.name} to file input`);
				} else {
					console.log(`Skipping ${file.name} (not a .csv file)`);
				}
			}
		});
	} else {
		// Use DataTransfer interface to access the file(s)
		[...ev.dataTransfer.files].forEach((file) => {
			if (file && file.name.endsWith('.csv')) {
				dataTransfer.items.add(file);
				console.log(`Adding ${file.name} to file input`);
			} else {
				console.log(`Skipping ${file.name} (not a .csv file)`);
			}
		});
	}

	// Update the file input with the new file list
	fileInput.files = dataTransfer.files;
});

document.addEventListener('dragover', (ev) => {
	console.log("Ready to accept the file");

	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();
});

function processFiles() {
	const fileInput = document.getElementById('file-input');
	const files = fileInput.files;

	if (files.length === 0) {
		alert('Please select one or more files first!');
		return;
	}

	const downloadLinksContainer = document.getElementById('download-links');
	downloadLinksContainer.innerHTML = ''; // Clear any existing links

	Array.from(files).forEach((file) => {
		const reader = new FileReader();
		reader.onload = function (event) {
			const fileContent = event.target.result;
			// Perform any processing on the file content here
			try {
				const processedContent = processContent(fileContent);

				// Create a new Blob for the processed content
				const blob = createCsvFile(processedContent);
				const url = URL.createObjectURL(blob);

				// Create a download link for each processed file
				const downloadLink = document.createElement('a');
				downloadLink.href = url;
				downloadLink.download = `processed_${file.name}`;
				downloadLink.textContent = `Download Processed ${file.name}`;
				downloadLinksContainer.appendChild(downloadLink);
			} catch (e) {
				console.error(e);
				alert(`Failed to process file ${file.name}`);
			}
		};
		console.info(`Reading file ${file.name}`);
		reader.readAsText(file);
	});
};

const processContent = (incoming_data) => {
	console.log('Processing file');
	// Filter out the header content:
	if (incoming_data.split("Product,Google Ads\n\n").length > 1)
		incoming_data = incoming_data.split("Product,Google Ads")[1];
	// Generate csv collection
	let data = parseCsv(incoming_data.trim());
	const new_headers = ['Original', 'Amount', 'Invalid activity', 'Account', 'Primary code', 'Codes'];
	// Just keep overwriting the original array - should probably change to mutating the input array instead to save on device memory
	data = findInvalidActivity(data);
	data = findCodes(data, PRIMARY_CODE_PATTERN, 'Primary code');
	data = findCodes(data, SECONDARY_CODE_PATTERN, 'Codes');

	const final_data = data.map(row => new_headers.map(val => row[val] ?? ""));
	return [new_headers, ...final_data];
}

const findInvalidActivity = (data) =>
	data.map(row => {
		if (/(invalid activity)/i.test(row['Description']))
			row['Invalid activity'] = 'Invalid activity'
		return row;
	});

const findCodes = (data, pattern, column) =>
	data.map(row => {
		const code = row['Description'].matchAll(pattern);
		const tmp = Array.from(code, (v) => v[1]);
		row[column] = Array.from(new Set(tmp)); // Remove duplicates
		return row;
	})

const parseCsv = (csvText) => {
	const rows = csvText.split('\n');
	const first_pass = rows.map((row) => {
		row = row.trim();
		const columns = [row];
		let inQuotes = false;
		let value = '';

		for (let i = 0; i < row.length; i++) {
			const char = row[i];
			const nextChar = row[i + 1];

			if (char === '"' && inQuotes && nextChar === '"') {
				value += '"';
				i++;
			} else if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				columns.push(value);
				value = '';
			} else {
				value += char;
			}
		}
		columns.push(value); // Push the last value
		return columns;
	});
	const headers = first_pass.shift();
	headers[0] = 'Original';
	console.log("Original headers:\n", headers);
	const second_pass = first_pass.map(e => {
		let i = 0;
		return e.reduce((acc, val) => ({ ...acc, [headers[i++]]: val }), {})
	})
	return second_pass.map(row => {
		row['Amount'] = row['Amount'].replace(',', '').replace('.', ',');
		return row;
	})
}

const createCsvFile = (data) => {
	console.log("Generating output file");
	const headers = data[0]
	const missing_headers = findLongestRow(data) - headers.length;
	if (missing_headers > 0) {
		// Need to stretch out the headers
		data[0].push(...Array.from({ length: missing_headers }, () => headers[headers.length - 1]))
	}
	const csvContent = data.map(row =>
		row.map(value =>
			typeof value === 'string' && value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value
		).join(',')
	).join('\n');

	// Create a Blob from the CSV content
	return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

const findLongestRow = (data) => data.reduce((acc, row) =>
	Math.max(acc, row.flat().length)
	, 0)