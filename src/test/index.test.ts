import { join } from "path";
import { DataHandler } from "..";

test('test case 1 should pass', async () => {
    const handler = await DataHandler.init(join(process.cwd(), 'src/test/data/test-values-1.csv'), true);
    const result = handler.query()
    expect(result).toBe('公司: DLV, 股价增值: 58.320000')
})

test('test case 2 should pass', async () => {
    const handler = await DataHandler.init(join(process.cwd(), 'src/test/data/test-values-2.csv'), true);
    const result = handler.query()
    expect(result).toBe('nil')
})