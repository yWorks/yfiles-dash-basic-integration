# yFiles Dash sample
Shows how to integrate yFiles for HTML in a [Dash/Plotly](https://plot.ly/products/dash/) application.

# Structure
`./dash-sample-app/`: A modification of the [Hello Dash](https://dash.plot.ly/getting-started) application. The modifications are:
* Use `serve_locally` to run unpublished, local components
* Replaced all content with the yFiles sample component

`./src/`: The sample component application based on the [Dash Component Boilerplate](https://github.com/plotly/dash-component-boilerplate) repository. It consists of the yFiles sample component and a basic React application to run the component in a JS environment.
 
The yFiles sample component is basically the [Collapsible-Trees demo](https://live.yworks.com/demos/complete/collapse/index.html) implemented as ES6 React component. 

# Component Properties
The yFiles sample component has optional `data` and `layoutMode` properties that may be set through the Dash application.

`data` needs to be an array representing a nested graph structure (see `./dash-sample-app/app.py`). This data structure is not mandatory in general, but it is how the sample component expects the data. Depending on the use case, it may be implemented differently. If `data` is not given, some hard-coded graph data is loaded with a warning on the console.

`layoutMode` controls the layout algorithm that is applied to the graph. Possible values: 'Hierarchic', 'Organic', 'Tree' or 'Balloon'. If `layoutMode` is not given, it defaults to 'Hierarchic'.

# Building the Dash component
There are two major steps in the build process: First the React component is bundled with webpack, then a python script is run to create a tarball that can be imported in the Dash application. 

To successfully build the React component, you need to copy a valid yFiles for HTML library to the component's resources.

## Copy the yFiles library to the component
The yFiles library and associated files should be copied to `./src/lib/resources/yfiles/`. The structure should be as follows:
- `./src/lib/resources/yfiles/es6-modules/` (The yFiles ES6 modules folder)
- `./src/lib/resources/yfiles/license.js`
- `./src/lib/resources/yfiles/yfiles.css`

Additionally, the yFiles CSS file needs to be copied to `./yfiles_components/` which is what the python script bundles into the Dash component. `yfiles.css` is a vital part of the yFiles for HTML library which is why it needs to be bundled alongside. It is also referenced in the MANIFEST, too.

# How to run
1. Build the Dash component with `npm run build:all-tar` (don't forget to copy a yFiles library to the component's resources first). This will bundle the React component with webpack and run the python scripts to create a tarball that is consumed by Dash. The tarball will be placed in `./dash-sample-app/`.
2. Switch to the `./dash-sample-app/` folder and install the newly created tarball with `pip install yfiles_components-0.0.1.tar.gz --upgrade`. This needs to be done each time a new tarball is created. Otherwise the old version will be used.
3. Run the Dash sample application with `npm run start-dash-app`. This will merely run `python app.py` in the `/dash-sample-app/` folder.
4. Open [http://127.0.0.1:8050/]() in the browser. 