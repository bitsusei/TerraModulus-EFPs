/** All searching function-related types and classes */

export type SearchEntry = App.EfpList["searchEntries"][number];


export interface Equalator<T> {
	equals(a: T, b: T): boolean;
}

export class StringEq implements Equalator<string> {
	equals(a: string, b: string) { return a === b; }
}

export abstract class Comparator<T> implements Equalator<T> {
	equals(a: T, b: T) { return this.compare(a, b) === 0; }
	/** +ve when `a` > `b`; 0 when `a` === `b`; -ve when `a` < `b` */
	abstract compare(a: T, b: T): number;
}

export class NumberCmp extends Comparator<number> {
	compare(a: number, b: number) { return a - b; }
}

export class DateCmp extends Comparator<Date> {
	compare(a: Date, b: Date) { return a.getTime() - b.getTime(); }
}


export interface Filter {
	filter: (e: SearchEntry) => boolean;
};

export class FilterField<T> {
	constructor(public readonly key: string) {}
}

export abstract class FieldFilter<T> implements Filter {
	readonly key: string;
	constructor(public readonly field: FilterField<T>) { this.key = field.key; }
	/** final */
	filter(e: SearchEntry) { return this.filterField(e[this.field.key as keyof SearchEntry] as T); }
	abstract filterField(val: T): boolean;
}

enum CmpOp {
	EQ = "==",
	NE = "!=",
	GT = ">",
	LT = "<",
	GE = ">=",
	LE = "<=",
}

export class RangeFilter<T> extends FieldFilter<T> {
	static readonly opMap = {
		"==": CmpOp.EQ,
		"!=": CmpOp.NE,
		">": CmpOp.GT,
		"<": CmpOp.LT,
		">=": CmpOp.GE,
		"<=": CmpOp.LE,
	};

	public op: CmpOp = $state<any>();
	public val: T = $state<any>();

	constructor(
		field: FilterField<T>,
		op: CmpOp,
		val: T,
		private readonly cmp: Comparator<T>
	) { super(field); this.op = op; this.val = val; }

	filterField(val: T) {
		switch (this.op) {
			case CmpOp.EQ: return this.cmp.compare(val, this.val) === 0;
			case CmpOp.NE: return this.cmp.compare(val, this.val) !== 0;
			case CmpOp.GT: return this.cmp.compare(val, this.val) > 0;
			case CmpOp.LT: return this.cmp.compare(val, this.val) < 0;
			case CmpOp.GE: return this.cmp.compare(val, this.val) >= 0;
			case CmpOp.LE: return this.cmp.compare(val, this.val) <= 0;
		}
	}
};

export class BooleanFilter implements Filter {
	public op: "and" | "or" = $state<any>();
	public val: Filter[] = $state<any>();

	constructor(
		op: "and" | "or",
		val: Filter[]
	) { this.op = op; this.val = val; }

	filter(e: SearchEntry) {
		if (this.val.length === 0) return false;
		switch (this.op) {
			case "and": return this.val.every(f => f.filter(e));
			case "or": return this.val.some(f => f.filter(e));
		}
	}
};

export class MatchFilter<T> extends FieldFilter<T> {
	public val: T = $state<any>();
	constructor(
		field: FilterField<T>,
		val: T,
		private readonly eq: Equalator<T>
	) { super(field); this.val = val; }
	filterField(val: T) { return this.eq.equals(val, this.val); }
}

export class NegFilter implements Filter {
	public val?: Filter = $state();
	constructor(val?: Filter) { this.val = val; }
	filter(e: SearchEntry) { return this.val === undefined ? false : !this.val.filter(e); }
}

export const filterFields = {
	created: {
		name: "Created",
		field: new FilterField<Date>("created"),
	},
	category: {
		name: "Category",
		field: new FilterField<App.EfpData["category"]>("category")
	},
	status: {
		name: "Status",
		field: new FilterField<App.EfpData["status"]>("status")
	},
	obsoletedBy: {
		name: "Obsoleted By",
		field: new FilterField<string>("obsoletedBy")
	},
	updatedBy: {
		name: "Updated By",
		field: new FilterField<string>("updatedBy")
	},
	obsoletes: {
		name: "Obsoletes",
		field: new FilterField<string>("obsoletes")
	},
	updates: {
		name: "Updates",
		field: new FilterField<string>("updates")
	},
	pullRequests: {
		name: "Pull Requests",
		field: new FilterField<string>("pullRequests")
	},
};
