import { Change } from '../enums/change.enum';

export interface IRow {
    name: string;
    date: number;
    value: number;
    change: Change;
    notes: string;
}
export interface ILoadedItem {
    earliest: IRow;
    latest: IRow;
    increasement: number;
}
