document.getElementById('process-files-button').addEventListener('click', processFiles);
document.getElementById('file-input').addEventListener('change', processFiles);

const patterns = {
	"Projekt 1": /(?:[^A-Za-z\d]|^)([A-Za-z]{3}[\d]{3})(?=[^A-Za-z\d]|$)/g,
	"Projekt 2": /(?:[^A-Za-z\d]|^)([A-Za-z]{3}[\d]{4})(?=[^A-Za-z\d]|$)/g,
	"Projekt 3": /(?:[^A-Za-z\d]|^)([A-Za-z]{2}[\d]{3})(?=[^A-Za-z\d]|$)/g,
	"Projekt 4": /(?:[^A-Za-z\d]|^)([A-Za-z]{2}[\d]{4})(?=[^A-Za-z\d]|$)/g,
	"Projekt 5": /(?:[^A-Za-z\d]|^)([A-Za-z]{5}[\d]{3})(?=[^A-Za-z\d]|$)/g,
	"Projekt 6": /(?:[^A-Za-z\d]|^)([A-Za-z]{4}[\d]{3})(?=[^A-Za-z\d]|$)/g
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
	// Detect and separate a header metadata block from beginning of file
	if (incoming_data.split("\n\n\n").length > 1)
		incoming_data = incoming_data.split("\n\n\n")[1];

	// Detect an separate bank info metadata block from end of file
	if (incoming_data.split("Bank account details(EUR)").length > 1)
		incoming_data = incoming_data.split("Bank account details(EUR)")[0];

	// Generate csv collection
	let { headers, data } = parseCsv(incoming_data.trim());
	// Just keep overwriting the original array
	// should probably change to mutating the input array instead to save on device memory
	// if the incoming file row count gets too big
	for (let [key, value] of Object.entries(patterns)) {
		data = findCode(data, value, key);
	}
	// data = data.map((i) => {
	// 	try {
	// 		i['Amount spent'] = i['Amount spent'].replace(',', '').replace('.', ',');
	// 	} finally {
	// 		return i;
	// 	}
	// }, [])

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

const parseCsv = (csv_text) => {
	const delimiter_character = document.getElementById('incoming-delimiter-character').value || ",";

	const first_pass = Papa.parse(csv_text, { delimiter: delimiter_character, header: true });

	return { headers: [...first_pass.meta.fields, ...Array.from({ length: 6 }, (_, v) => `Projekt ${v + 1}`)], data: first_pass.data }
}

const createCsvFile = (data) => {
	const delimiter_character = document.getElementById('outgoing-delimiter-character').value || ',';
	const csvContent = stringify(data, { delimiter: delimiter_character })

	// Create a Blob from the CSV content
	return new Blob([csvContent], { type: 'text/csv;charset=utf-8', encoding: 'utf-8' });
}