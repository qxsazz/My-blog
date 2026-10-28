export interface NavigationLink { label:string; href:string; external?:boolean }
const about = { label:'关于我', href:'/about/' };
const now = { label:'正在做', href:'/now/' };
const projects = { label:'项目作品', href:'/projects/' };
const bookmarks = { label:'技术书签', href:'/bookmarks/' };
const aboutSite = { label:'关于本站', href:'/about-site/' };
const history = { label:'建站历史', href:'/history/' };
const changes = { label:'更新日志', href:'/changelog/' };
const contact = { label:'联系交流', href:'/about/#contact' };
export const homeMenuGroups: { title:string; links:NavigationLink[] }[] = [
  { title:'认识我', links:[about,now,projects,bookmarks] },
  { title:'探索小站', links:[aboutSite,history,changes,contact] },
];
export const footerGroups: { title:string; links:NavigationLink[] }[] = [
  { title:'内容', links:[{label:'技术文稿',href:'/posts/'},{label:'生活手记',href:'/notes/'},{label:'文章归档',href:'/timeline/'},bookmarks] },
  { title:'实践', links:[projects,now,{label:'本站源码',href:'https://github.com/qxsazz/My-blog',external:true}] },
  { title:'小站', links:[about,aboutSite,history,changes] },
];
export const technicalBookmarks = [
  { title:'Python 文档', href:'https://docs.python.org/zh-cn/3/', description:'Python 语言教程与标准库参考。', category:'语言' },
  { title:'cppreference', href:'https://en.cppreference.com/w/', description:'C 与 C++ 语言、标准库参考。', category:'语言' },
  { title:'PyTorch 文档', href:'https://docs.pytorch.org/docs/stable/index.html', description:'张量计算、自动求导与模型训练的框架资料。', category:'模型开发' },
  { title:'Hugging Face Transformers', href:'https://huggingface.co/docs/transformers/index', description:'模型加载、推理与训练相关文档。', category:'模型开发' },
];
