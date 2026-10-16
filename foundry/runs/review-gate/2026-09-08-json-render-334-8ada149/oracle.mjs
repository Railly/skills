import {createRequire} from 'node:module';
const repo='/Users/raillyhugo/Programming/vercel/json-render-334-review';
const require=createRequire(repo+'/packages/tanstack-start/package.json');
const {createRootRoute,createRoute,createRouter,createMemoryHistory}=require('@tanstack/react-router');
const {matchRoute,createStartApp,collectStaticPaths}=await import(repo+'/packages/tanstack-start/dist/server.mjs');
const page={root:'root',elements:{root:{type:'Text',props:{value:'x'},children:[]}}};
for (const paths of [['/docs','/docs/$'],['/blog/$slug','/blog/$slug/$'],['/','/$']]) {
 const root=createRootRoute();
 const routes=paths.map(path=>createRoute({getParentRoute:()=>root,path}));
 const router=createRouter({routeTree:root.addChildren(routes),history:createMemoryHistory({initialEntries:['/']})});
 const spec={routes:Object.fromEntries(paths.map(p=>[p,{page}]))};
 const path=paths[0].replace('$slug','hello');
 console.log(JSON.stringify({paths,pathname:path,adapter:matchRoute(spec,path)?.pattern,tanstack:router.matchRoutes(path).at(-1)?.routeId}));
}
