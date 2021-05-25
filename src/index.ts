import csv from 'csv-parser';
import { join } from 'path';
import { ILoadedItem, IRow } from './interfaces/loaded-item.interface';
import { createReadStream } from 'promise-fs';
import { ColumnName } from './enums/column-name.enum';
import { Change } from './enums';
import { ChangeValues } from './enums/change.enum';
import { MS_ONE_DAY } from './constants';

export class DataHandler {
    private static _instance: DataHandler;

    /**
     * init a handler: load and parse data
     * @param path the path of the data file
     * @param force force reload
     * @returns 
     */
    static async init(
        path = join(process.cwd(), 'data/values.csv'), 
        force = false
    ) {
        if (!this._instance || force) {
            this._instance = new DataHandler(path);
            await this._instance.load()
        }
        return this._instance;
    }

    constructor(private readonly path: string) { }

    cache: { [name: string]: ILoadedItem } = {}

    public async load() {
        return new Promise((resolve, reject) => {
            createReadStream(this.path)
                .pipe(csv())
                .on('data', (data) => {
                    const row = this.regularifyRow(data);
                    if (row) {
                        this.saveCache(row);
                    }
                })
                .on('end', () => {
                    resolve('success');
                })
                .on('error', reject);
        })
    }

    private saveCache(row: IRow) {
        let changed = false;
        if (!this.cache[row.name]) {
            this.cache[row.name] = { latest: row, earliest: row, increasement: 0 };
        } else if (row.date >= this.cache[row.name].latest.date) {
            this.cache[row.name].latest = row;
            changed = true;
        } else if (row.date <= this.cache[row.name].earliest.date) {
            this.cache[row.name].earliest = row;
            changed = true;
        }
        if (changed) {
            this.cache[row.name].increasement = this.cache[row.name].latest.value - this.cache[row.name].earliest.value;
        }
    }

    private regularifyRow(raw: { [key: string]: string }): IRow | null {
        const row = {} as IRow;
        for (const key in raw) {
            const val = raw[key];
            switch (key.toLowerCase()) {
                case ColumnName.name:
                    row.name = val;
                    break;
                case ColumnName.change:
                    if (!ChangeValues.includes(val as Change)) {
                        return null;
                    }
                    row.change = val as Change;
                    break;
                case ColumnName.date:
                    const date = new Date(val);
                    if ((date as unknown as string) === 'Invalid Date') {
                        return null;
                    }
                    row.date = Math.ceil(date.getTime() / MS_ONE_DAY);
                    break;
                case ColumnName.notes:
                    row.notes = val;
                    break;
                case ColumnName.value:
                    const fval = parseFloat(val);
                    if (isNaN(fval)) {
                        return null;
                    }
                    row.value = fval;
                    break;
                default:
                    return null;
            }
        }
        return row;
    }

    public query(): string {
        const sorted = Object.values(this.cache)
            .filter(item => item.increasement > 0)
            .sort((item1, item2) => {
                if (item1.increasement < item2.increasement) {
                    return 1
                } else if (item1.increasement > item2.increasement) {
                    return -1;
                }
                return 0
            });
        if (sorted.length === 0) return 'nil'
        const chosenItem = sorted[0];
        return `公司: ${chosenItem.earliest.name}, 股价增值: ${chosenItem.increasement.toFixed(6)}`
    }
}
