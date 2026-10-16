import React from 'react';
import {createRoot} from 'react-dom/client';
import {createRootRoute,createRoute,createRouter,RouterProvider,Outlet,useRouter,HeadContent} from '@tanstack/react-router';
import {StartAppProvider,PageRenderer,StartLoading,StartErrorBoundary,StartNotFound} from '/Users/raillyhugo/Programming/vercel/json-render-334-review/packages/tanstack-start/dist/index.mjs';
import {createStartApp} from '/Users/raillyhugo/Programming/vercel/json-render-334-review/packages/tanstack-start/dist/server.mjs';
const text=(value)=>({root:'text',elements:{text:{type:'Text',props:{value},children:[]}}});
const statePage={root:'box',elements:{box:{type:'Container',props:{},children:['data','link','linkText','button']},data:{type:'Text',props:{value:{$state:'/value'}},children:[]},link:{type:'Link',props:{href:'/ok?sort=name#section'},children:['linkText']},linkText:{type:'Text',props:{value:'Query link'},children:[]},button:{type:'Button',props:{},children:[],on:{press:{action:'navigate',params:{href:'/ok?sort=name#section'}}}}}};
let attempts=0;
let counter=0;
const spec={routes:{'/':{page:text('Home')},'/ok':{page:statePage,loader:'data'},'/error':{page:text('Recovered'),loader:'fail'},'/custom-loading':{page:text('Loaded'),loader:'slow',loading:text('Custom pending')},'/encoded/$id':{page:text({$state:'/value'}),loader:'encoded'}}};
const app=createStartApp({spec,loaders:{data:()=>({value:'value '+(++counter)}),fail:()=>{attempts++;window.reviewAttempts=attempts;if(attempts===1)throw new Error('Transient failure');return{}},slow:()=>new Promise(r=>setTimeout(()=>r({}),1800)),encoded:({id})=>({value:id})}});
const registry={Text:({element})=><span>{String(element.props.value)}</span>,Container:({children})=><div>{children}</div>,Button:({emit})=><button onClick={()=>emit('press')}>Query action</button>};
const root=createRootRoute({component:()=> <StartAppProvider registry={registry} spec={spec}><HeadContent/><Toolbar/><Outlet/></StartAppProvider>});
const route=createRoute({getParentRoute:()=>root,path:'$',loader:({location})=>app.getPageData({pathname:location.pathname}),head:({match})=>app.getHead({pathname:match.pathname}),component:()=>{const data=route.useLoaderData();return data?<PageRenderer {...data}/>:<StartNotFound/>},pendingComponent:StartLoading,errorComponent:StartErrorBoundary,pendingMs:20,pendingMinMs:0});
const router=createRouter({routeTree:root.addChildren([route]),defaultPendingMs:20});
function Toolbar(){const r=useRouter();return <nav><button onClick={()=>r.navigate({to:'/ok'})}>OK route</button><button onClick={()=>r.navigate({to:'/error'})}>Fail once</button><button onClick={()=>r.navigate({to:'/custom-loading'})}>Slow route</button><button onClick={()=>r.invalidate()}>Invalidate</button></nav>}
window.reviewRouter=router;
createRoot(document.getElementById('root')).render(<RouterProvider router={router}/>);
