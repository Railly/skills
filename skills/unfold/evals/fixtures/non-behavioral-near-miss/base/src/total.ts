export function total(values: number[]) {
	const result = values.reduce((sum, value) => sum + value, 0);
	return result;
}
