document.getElementById('processFileButton').addEventListener('click', processFile);

const PRIMARY_CODE_PATTERN = /(?:[^\w]|^|_\/)([A-Z]{3}\d{3})(?=[^\w]|$|_)/g;
const SECONDARY_CODE_PATTERN = /(?:[^\w]|^|_|\/)([A-Z]{4}\d{2,3}|[A-Z]{2}\d{6}|[A-Z]{2}\d{4})(?=[^\w]|$|_)/g;
function processFile() {
	const fileInput = document.getElementById('fileInput');
	const file = fileInput.files[0];

	if (!file) {
		alert('Please select a file first!');
		return;
	}

	const reader = new FileReader();
	reader.onload = function (event) {
		const fileContent = event.target.result;
		// Perform any processing on the file content here
		// For demonstration, we'll just convert it to uppercase
		const processedContent = processContent(fileContent);

		// Create a new file and trigger a download
		const blob = createCsvFile(processedContent);
		const url = URL.createObjectURL(blob);

		const downloadLink = document.getElementById('downloadLink');
		downloadLink.href = url;
		downloadLink.download = 'processed_file.csv';
		downloadLink.style.display = 'block';
		downloadLink.textContent = 'Download Processed File';
	};
	console.info("Reading file");
	reader.readAsText(file);
}

const processContent = (incoming_data) => {
	console.log('Processing file');
	// Filter out the header content:
	if (incoming_data.split("Product,Google Ads\n\n").length > 1)
		incoming_data = incoming_data.split("Product,Google Ads\n\n")[1];
	// Generate csv collection
	let data = parseCsv(incoming_data.trim());
	const new_headers = ['Account ID', 'Amount', 'Invalid activity', 'Account', 'Primary code', 'Codes'];
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
	const first_pass = rows.map(row => {
		const columns = [];
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

function createCsvFile(data) {
	console.log("Generating output file");
	const csvContent = data.map(row =>
		row.map(value =>
			typeof value === 'string' && value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value
		).join(',')
	).join('\n');

	// Create a Blob from the CSV content
	return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

