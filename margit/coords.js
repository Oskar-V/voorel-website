{
	const dmsToDd = (dmsStr) => {
		// Replace ° and ' with commas
		dmsStr = dmsStr.replace(/°|'/g, ",");
		// Split DMS string into parts
		let parts = dmsStr.split(",").map(part => parseFloat(part));
		let [d, m, s] = parts;
		// Convert DMS to Decimal Degrees
		let dd = d + (m / 60) + (s / 3600);
		return dd.toFixed(6);
	}
	const pattern = /(\S*)/g

	const input_field = document.getElementById('input');
	const output_field = document.getElementById('output');
	input_field?.addEventListener('input', () => {
		// console.log(i.match(pattern))
		let t = input_field.value;
		t = t.replace(pattern, dmsToDd)
		output_field.value = t;
	})

	document.getElementById('copy')?.addEventListener('click', () => {
		if (navigator.clipboard === undefined) {
			alert('Failed to copy - please select and copy manually')
			return
		}
		navigator.clipboard.writeText(output_field.value)
	})
}