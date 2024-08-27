document.getElementById('process-files-button').addEventListener('click', processFiles);
document.getElementById('file-input').addEventListener('change', processFiles);

const patterns = {
	"Project 1": /(?:[^A-Za-z\d]|^)([A-Z]{3}[\d]{3})(?=[^A-Za-z\d]|$)/g,
	"Project 2": /(?:[^A-Za-z\d]|^)([A-Z]{3}[\d]{4})(?=[^A-Za-z\d]|$)/g,
	"Project 3": /(?:[^A-Za-z\d]|^)([A-Z]{2}[\d]{3})(?=[^A-Za-z\d]|$)/g,
	"Project 4": /(?:[^A-Za-z\d]|^)([A-Z]{2}[\d]{4})(?=[^A-Za-z\d]|$)/g,
	"Project 5": /(?:[^A-Za-z\d]|^)([A-Z]{5}[\d]{3})(?=[^A-Za-z\d]|$)/g,
	"Project 6": /(?:[^A-Za-z\d]|^)([A-Z]{4}[\d]{3})(?=[^A-Za-z\d]|$)/g
}

/**
 * Codes
 * 3 + 3
 * 3 + 4
 * 2 + 3
 * 2 + 4
 * 5 + 4
 * 4 + 3
 */


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
	processFiles();
});

document.addEventListener('dragover', (ev) => {
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
				console.log(`Processing ${file.name}`);

				const processedContent = processContent(fileContent);

				// Create a new Blob for the processed content
				console.log(`Generating processed_${file.name}`);
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
	// Generate csv collection
	let { headers, data } = parseCsv(incoming_data.trim());
	// const new_headers = ['Original', 'Amount', 'Invalid activity', 'Account', 'Primary code', 'Codes'];
	// Just keep overwriting the original array
	// should probably change to mutating the input array instead to save on device memory
	// if the incoming file row count gets too big
	for (let [key, value] of Object.entries(patterns)) {
		data = findCode(data, value, key);
	}

	// Map each value to their correct column
	const final_data = data.map(row => headers.map(val => row[val] ?? ""));

	// Add the header rows to the final output
	final_data.unshift(headers);
	return final_data;
}

const findCode = (data, pattern, column) =>
	data.map(row => {
		// Rewrite this - this is pure garbage
		const code = row['Campaign name'].matchAll(pattern);
		const tmp = Array.from(code, (v) => v[1]);
		row[column] = Array.from(new Set(tmp))[0] ?? ""; // Remove duplicates
		return row;
	})

const parseCsv = (csvText) => {
	const delimiter_character = document.getElementById('incoming-delimiter-character').value || ",";
	const first_pass = parse(csvText, { delimiter: delimiter_character });
	const headers = [...first_pass.shift(), "", ...Array.from({ length: 6 }, (k, v) => `Projekt ${v + 1}`)];
	// Map the array to object for each value
	return {
		headers,
		data: first_pass.map(e => {
			let i = 0;
			return e.reduce((acc, val) => ({ ...acc, [headers[i++]]: val }), {})
		})
	}
}

const createCsvFile = (data) => {
	const headers = data[0];
	const missing_headers = findLongestRow(data) - headers.length;
	if (missing_headers > 0) {
		// Need to stretch out the headers
		data[0].push(...Array.from({ length: missing_headers }, () => headers[headers.length - 1]))
	}
	const delimiter_character = document.getElementById('outgoing-delimiter-character').value || ','
	const csvContent = data.map(row =>
		row.map(value => {
			if (typeof value === 'string' && value.includes(','))
				return decodeURI(encodeURI(`"${value.replace(/"/g, '""')}"`));
			if (typeof value === 'object' && typeof value.join === 'function')
				return decodeURI(encodeURI(value.join(delimiter_character)));
			return decodeURI(encodeURI(value));
		}
		).join(delimiter_character)
	).join('\n');

	// Create a Blob from the CSV content
	return new Blob([csvContent], { type: 'text/csv;charset=utf-8', encoding: 'utf-8' });
}

const findLongestRow = (data) => data.reduce((acc, row) =>
	Math.max(acc, row.flat().length)
	, 0)