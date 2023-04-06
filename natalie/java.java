public class App {

	// Create a helper function to compare the signs of two values
	public static boolean areDifferentSigns(int a, int b) {
		// Use a rule of multiplication to determine if two values have different signs
		// Multiplying same sign integers together always gives a positive value and
		// vice versa
		return (a * b) < 0;
	}

	// Tree recursion function wrapper
	public static int muududUnaarne(int[] a) {
		// Add the correct starting parameters to the recursive function
		return muududUnaarne(a, 0, 1);
	}

	// Tree recursion function
	public static int muududUnaarne(int[] a, int i, int j) {
		// Return 0 if the array can't possibly contain a sign change (array contains
		// less then 2 elements) or we have reached the end of the array
		if (a.length <= 1 || j >= a.length)
			return 0;

		// Visual representation of the steps:
		// System.out.println(String.format("%d|%d - %d|%d", i, j, a[i], a[j]));

		if (a[i] == 0) {
			// If the first value in comparison is a zero, let's move to the next pair
			// This is needed if the array starts with zeros, because once j finds a valid
			// value, then for every next call i will have a valid value
			return muududUnaarne(a, i + 1, i + 2);
		} else if (a[j] == 0) {
			// If the second value in comparison is a zero let's keep the first value, but
			// move the second value forward
			// This is needed if the array has zeros between valid values or at the end
			return muududUnaarne(a, i, j + 1);
		}
		// Add either a zero or one to the value of the next function call
		// When looking for the next pair to compare, we start looking at the end of the
		// current pair, hence for the next call i = j
		return (areDifferentSigns(a[i], a[j]) ? 1 : 0) + muududUnaarne(a, j, j + 1);
	}

	// Linear recursion function wrapper
	public static int muududBinaarne(int[] a) {
		// Add the correct parameters to the recursive function
		return muududBinaarne(a, 0, 1);
	}

	// Linear recursion function
	public static int muududBinaarne(int[] a, int i, int j) {
		// Return 0 if the array can't possibly contain a sign change (array contains
		// less then 2 elements) or we have reached the end of the array
		if (a.length <= 1 || j >= a.length)
			return 0;
		// ???
		return 1;
	}

	public static void main(String[] args) throws Exception {
		// Create test arrays
		int[] a = { -1, 0, 4, 0, 0, 0, 0, 0, 0, 0, -9, 0, 0, 0 }; // Should return 1
		int[] b = { 22, 0, -9, 8, -9, 0, 0, -12, 18, 0, 28, 0, 25, 0, 25, 0, 10 }; // Should return 4

		// Call linear recursion function on test arrays
		System.out.println(muududUnaarne(a));
		System.out.println(muududUnaarne(b));

		// Call tree recursion function on test arrays
		System.out.println(muududBinaarne(a));
		System.out.println(muududBinaarne(b));

	}
}
