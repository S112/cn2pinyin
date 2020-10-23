## Installation and Usage

Install the library with `npm install cn2pinyin`


```javascript
var py = require('cn2pinyin');
or
import py from 'cn2pinyin';

整体转换
py.toPinyin('中文'); // ZHONGWEN
py.toPinyin('中文', ' '); // ZHONG WEN
py.toPinyin('中文', ' ', true); // zhong wen

某个字转换
py.atomToPinyin('中文', 0) // ZHONG
py.atomToPinyin('中文', 0, true) // zhong
```
