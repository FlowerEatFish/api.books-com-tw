import booksComTwCollection from '../src/index';

const timeout = 60 * 1000;

describe('Run demo', (): void => {
  it('Should get one result as Array', async (): Promise<void> => {
    const result: object[] = await booksComTwCollection('春夏秋冬，日日食光。生活美學家的鑄鐵鍋料理手帖');

    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(1);
  }, timeout);

  it('Should get results as Array and no more than 12', async (): Promise<void> => {
    const result: object[] = await booksComTwCollection('相對論，愛因斯坦教會我們什麼');

    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBeLessThanOrEqual(12);
  }, timeout);

  it('Should do not have any result as Null', async (): Promise<void> => {
    const result: null = await booksComTwCollection('blablablablablablablablablablablabla');

    expect(result).toBeNull();
  }, timeout);
});
