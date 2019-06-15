/**
 * To parse the results when the fetcher got one or more data.
 */

export interface IPriceType {
  discount: number;
  currentPrice: number;
}

export interface IItemType {
  title: string;
  url: string;
  author: string[];
  publisher: string;
  publicationDate: string;
  imageUrl: string;
  price: IPriceType;
  introduction: string;
}

const removeAllHtmlTag: Function = (text: string): string => {
  let result: string = text.replace(/<\/?\w+[^>]*>/gi, '');
  // To remove beginning and end of spaces
  result = result.replace(/^\s+/, '');
  result = result.replace(/\s+$/, '');

  return result;
};

const setItemWithTag: Function = (text: string, tag: string): number | null => {
  try {
    if (text.includes(tag)) {
      const newRegExp: RegExp = new RegExp(`<strong>\\s*<b>\\d+<\\/b>\\s*${tag}<\\/strong>`, 'gi');
      const result: string[] | null = text.match(newRegExp);

      return result ? Number(result[0].replace(/\D/gi, '')) : null;
    }

    return null;
  } catch (error) {
    return null;
  }
};

const getItemPrice: Function = (htmlCode: string): IPriceType | null => {
  try {
    const result: string[] | null = htmlCode.match(/<span class="price">[\w\W]*?<\/span>/gi);

    if (result) {
      return {
        discount: setItemWithTag(result[0], '折'),
        currentPrice: setItemWithTag(result[0], '元')
      };
    }

    return null;
  } catch (error) {
    return null;
  }
};

const getItemImageUrl: Function = (htmlCode: string): string | null => {
  try {
    let result: string[] | null = htmlCode.match(/<img [\w\W]*?>/gi);

    if (result) {
      result = result[0].match(/data-original="[\w\W]*?"/gi);
    }

    return result
      ? result[0].replace(/data-original="https:\/\/im1\.book\.com\.tw\/image\/getImage\?i=([\w\W]*?)&[\w\W]*/gi, '$1') : null;
  } catch (error) {
    return null;
  }
};

const getItemAuthor: Function = async (htmlCode: string): Promise<string[] | null> => {
  try {
    const result: string[] | null = htmlCode.match(/<a rel="go_author"[\w\W]*?>[\w\W]*?<\/a>/gi);

    if (result && result.length > 0) {
      const resultWithoutHtmlTag: string[] = await Promise.all(result.map((value: string): string => removeAllHtmlTag(value)));

      return resultWithoutHtmlTag;
    }

    return null;
  } catch (error) {
    return null;
  }
};

const getItemPublisher: Function = (htmlCode: string): string | null => {
  try {
    let result: string[] | null;
    if (htmlCode.includes('target="_blank" rel="mid_publish"')) {
      // For Chinese books
      result = htmlCode.match(/<a target="_blank" rel="mid_publish"[\w\W]*?>[\w\W]*?<\/a>/gi);
    } else {
      // For Western books
      result = htmlCode.match(/<a rel="mid_publish"[\w\W]*?>[\w\W]*?<\/a>/gi);
    }

    return result ? removeAllHtmlTag(result[0]) : null;
  } catch (error) {
    return null;
  }
};

const getItemPublicationDate: Function = (htmlCode: string): string | null => {
  try {
    const result: string[] | null = htmlCode.match(/出版日期: \d{4}-\d{2}-\d{2}/);

    return result ? result[0].replace('出版日期: ', '') : null;
  } catch (error) {
    return null;
  }
};

const getItemUrl: Function = (htmlCode: string): string | null => {
  try {
    let result: string[] | null = htmlCode.match(/<h3>[\w\W]*?<\/h3>/gi);
    if (result) {
      result = result[0].match(/<a [\w\W]*?<\/a>/gi);
    }

    return result ? result[0].replace(/<a [\w\W]*?href="([\w\W]*?)"[\w\W]*/gi, 'http:$1') : null;
  } catch (error) {
    return null;
  }
};

const getItemTitle: Function = (htmlCode: string): string | null => {
  try {
    const result: string[] | null = htmlCode.match(/<h3>[\w\W]*?<\/h3>/gi);

    return result ? removeAllHtmlTag(result[0]) : null;
  } catch (error) {
    return null;
  }
};

const getItemIntroduction: Function = (htmlCode: string): string | null => {
  try {
    const result: string[] | null = htmlCode.match(/<p>[\w\W]*?<\/p>/gi);

    if (result) {
      // To remove useless texts like "更多資訊"
      const filterResult = result[0].replace(/<span>[\w\W]*?<\/span>/gi, '');

      return removeAllHtmlTag(filterResult);
    }
    return null;
  } catch (error) {
    return null;
  }
};

const getItem: Function = async (htmlCode: string): Promise<IItemType> => {
  const author: string[] = await getItemAuthor(htmlCode);

  return {
    title: getItemTitle(htmlCode),
    url: getItemUrl(htmlCode),
    author,
    publisher: getItemPublisher(htmlCode),
    publicationDate: getItemPublicationDate(htmlCode),
    imageUrl: getItemImageUrl(htmlCode),
    price: getItemPrice(htmlCode),
    introduction: getItemIntroduction(htmlCode)
  };
};

const splitHtmlCode: Function = (htmlCode: string): string[] | null => htmlCode.match(/<li class="item">[\w\W]*?<\/li>/gi);

const getSpecificHtmlCode: Function = (htmlCode: string): string | null => {
  const result = htmlCode.match(/<ul class="searchbook">[\w\W]*?<\/ul>/gi);

  return result ? result[0] : null;
};

export const itemListParser: Function = async (htmlCode: string): Promise<IItemType[]> => {
  // To get specific html code containing data
  const targetHtmlCode: string = await getSpecificHtmlCode(htmlCode);
  // To split code from string into array by special tag
  const itemListWithCode: string[] = await splitHtmlCode(targetHtmlCode);
  if (itemListWithCode.length > 0) {
    // To build up data we want
    const itemList: IItemType[] = await Promise.all(itemListWithCode.map((value: string): IItemType => getItem(value)));

    return itemList;
  }

  return [];
};
