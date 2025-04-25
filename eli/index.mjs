const countdown = document.getElementById('countdown');

const step_increment = 45; // Amount of minutes per step
const target_date = new Date('2025-05-15T15:25:00');
const start_date = new Date('2025-04-25T19:00:00');

const initial_transforms = [
	{ translateX: 2, translateY: -2, rotate: 4 },
	{ translateX: -1, translateY: 0, rotate: -5 }
];

function lerp(start, end, t) {
	return start + (end - start) * t;
}

function updateTransforms() {
	const now = new Date();
	const totalDuration = target_date - start_date;
	const elapsed = Math.min(Math.max(now - start_date, 0), totalDuration);
	const progress = Math.min(elapsed / totalDuration, 1);

	document.querySelectorAll('svg path').forEach((path, index) => {
		const init = initial_transforms[index];

		const tx = lerp(init.translateX, 0, progress);
		const ty = lerp(init.translateY, 0, progress);
		const rot = lerp(init.rotate, 0, progress);

		path.setAttribute('transform', `translate(${tx.toFixed(2)},${ty.toFixed(2)}) rotate(${rot.toFixed(2)})`);
	});

	if (progress < 1) {
		requestAnimationFrame(updateTransforms);
	}
}

function updateCountdownText() {
	const now = new Date();
	const timeLeftMs = Math.max(target_date - now, 0);
	const daysLeft = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
	const stepsLeft = Math.max(0, Math.ceil(timeLeftMs / (step_increment * 60 * 1000)) - 1);

	countdown.innerHTML = `
		<span>${daysLeft} day${daysLeft !== 1 ? 's' : ''} left 💖</span><br/>
		<span>or</span><br/>
		<span>about ${stepsLeft} game${stepsLeft !== 1 ? 's' : ''} of Valorant 🎮</span>
	`;
}

updateCountdownText();
updateTransforms();

setInterval(updateCountdownText, 60 * 1000);
