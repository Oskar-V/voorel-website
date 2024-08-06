{
	const dmsToDd = (dms_str) => {
		if (dms_str === "") {
			return "";
		}
		// Replace ° and ' with commas
		dms_str = dms_str.replace(/°|'/g, ",");
		// Split DMS string into parts
		let parts = dms_str.split(",").map(part => parseFloat(part));
		let [d, m, s] = parts;
		// Convert DMS to Decimal Degrees
		let dd = d + (m / 60) + (s / 3600);
		return dd.toFixed(6);
	}
	const pattern = /([\d.'°]+)/g

	const input_field = document.getElementById('input');
	const output_field = document.getElementById('output');
	input_field?.addEventListener('input', () => {
		output_field.value = input_field.value.replace(pattern, dmsToDd);
	})

	document.getElementById('copy')?.addEventListener('click', () => {
		if (navigator.clipboard === undefined) {
			alert('Failed to copy - please select and copy manually')
			return
		}
		navigator.clipboard.writeText(output_field.value)
	})
}