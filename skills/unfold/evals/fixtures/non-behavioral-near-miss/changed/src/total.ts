export function total(values: number[]) {
	const totalValue = values.reduce((sum, value) => sum + value, 0);
	return totalValue;
}
