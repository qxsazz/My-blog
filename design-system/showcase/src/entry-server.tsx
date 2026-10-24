import {renderToString} from 'react-dom/server'
import App,{getPageMeta} from './App'
export function render(path:string){return {html:renderToString(<App initialPath={path}/>),...getPageMeta(path)}}
