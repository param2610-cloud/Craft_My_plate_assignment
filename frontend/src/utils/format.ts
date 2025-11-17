const dateFormatter = new Intl.DateTimeFormat('en-IN', {
	dateStyle: 'medium',
	timeStyle: 'short'
});

export const formatCurrency = (value: number) => `₹${value.toFixed(2)}`;

export const formatDateTime = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return dateFormatter.format(date);
};

export const formatTimeRange = (start: string, end: string) => {
	return `${formatDateTime(start)} → ${formatDateTime(end)}`;
};
