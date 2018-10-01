/* eslint-disable no-eq-null,no-magic-numbers,no-implicit-coercion */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import '../resources/yfiles/license'
import '../resources/yfiles/yfiles.css'
import {
  GraphComponent,
  GraphViewerInputMode,
  GraphItemTypes,
  INode,
  DefaultGraph,
  Size,
  ExteriorLabelModel,
  FilteredGraphWrapper, TreeBuilder,
} from 'yfiles/view-component'
import {
  BalloonLayout,
  FixNodeLayoutStage,
  LayoutOrientation,
  PlaceNodesAtBarycenterStage,
  StraightLineEdgeRouter,
  Scope, SequentialLayout,
  OrganicScope
} from 'yfiles/layout-core'
import {OrganicLayout} from 'yfiles/layout-organic';
import { TreeLayout } from 'yfiles/layout-tree'
import { HierarchicLayout,LayoutMode } from 'yfiles/layout-hierarchic'
import { List, YMap } from 'yfiles/core'
import {
  CompositeLayoutData,
  FixNodeLayoutData, HierarchicLayoutData,
  LayoutExecutor,
  OrganicLayoutData,
  PlaceNodesAtBarycenterStageData,
  StraightLineEdgeRouterData,
} from 'yfiles/view-layout-bridge'
import { StringTemplateNodeStyle, TemplateNodeStyle } from 'yfiles/styles-template'

/**
 * GraphComponent is an example component.
 * It takes a property, `label`, and
 * displays it.
 * It renders an input with the property `value`
 * which is editable by the user.
 */
export default class GraphComponentReact extends Component {
  get graphComponent() {
    return this.$graphComponent
  }

  set graphComponent(value) {
    this.$graphComponent = value
  }


  get leafNodeStyleTemplate() {
    return `<rect stroke="none" fill="#81E368" rx="4" ry="4" width="58" height="28" transform="translate(1 1)"></rect>`
  }

  get innerNodeStyleTemplate() {
    return `
<g>
  <rect stroke="none" fill="{TemplateBinding styleTag, Converter=collapseDemo.backgroundConverter}" rx="4" ry="4" width="60" height="30"></rect>
  <g data-content="{TemplateBinding styleTag, Converter=collapseDemo.iconConverter}"></g>
</g>`
  }

  get expandIconTemplate() {

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    polygon.setAttribute('stroke', '#FFF')
    polygon.setAttribute('stroke-width', '3')
    polygon.setAttribute('fill', 'none')
    polygon.setAttribute('points', '6,17 6,12 1,12 1,6 6,6 6,1 12,1 12,6 17,6 17,12 12,12 12,17')

    const polygon2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    polygon2.setAttribute('stroke', 'none')
    polygon2.setAttribute('fill', '#999999')
    polygon2.setAttribute('points', '6,17 6,12 1,12 1,6 6,6 6,1 12,1 12,6 17,6 17,12 12,12 12,17')

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('transform', 'translate(21 6)')
    g.appendChild(polygon)
    g.appendChild(polygon2)

    return g
  }

  get collapseIconTemplate() {

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.x.baseVal.value = 1
    rect.y.baseVal.value = 6
    rect.width.baseVal.value = 16
    rect.height.baseVal.value = 6
    rect.setAttribute('stroke', '#FFFFFF')
    rect.setAttribute('stroke-width', '3')
    rect.setAttribute('fill', 'none')
    rect.setAttribute('points', '6,17 6,12 1,12 1,6 6,6 6,1 12,1 12,6 17,6 17,12 12,12 12,17')

    const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect2.x.baseVal.value = 1
    rect2.y.baseVal.value = 6
    rect2.width.baseVal.value = 16
    rect2.height.baseVal.value = 6
    rect2.setAttribute('stroke', 'none')
    rect2.setAttribute('fill', '#999999')
    rect2.setAttribute('points', '6,17 6,12 1,12 1,6 6,6 6,1 12,1 12,6 17,6 17,12 12,12 12,17')

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('transform', 'translate(21 6)')
    g.appendChild(rect)
    g.appendChild(rect2)

    return g
  }

  componentDidMount() {
    const container = this.div

    this.layoutAlgorithms = new Map()
    this.nodeCollapsedMap = new YMap()
    this.nodeVisibility = new YMap()
    this.runningLayout = false

    this.graphComponent = new GraphComponent(container)

    this.initializeLayouts()
    this.initializeInputModes()

    this.graphComponent.graph = this.initializeGraph()
    this.graphComponent.fitGraphBounds()

    this.runLayout()
  }


  initializeGraph() {
    // Create the graph instance that will hold the complete graph.
    const completeGraph = new DefaultGraph()

    // Create a new style that uses the specified svg snippet as a template for the node.
    const leafNodeStyle = new StringTemplateNodeStyle(this.leafNodeStyleTemplate)

    // Create a new style that uses the specified svg snippet as a template for the node.
    // completeGraph.nodeDefaults.style = new TemplateNodeStyle('InnerNodeStyleTemplate')
    completeGraph.nodeDefaults.style = new StringTemplateNodeStyle(this.innerNodeStyleTemplate)
    completeGraph.nodeDefaults.style.styleTag = { collapsed: true }
    completeGraph.nodeDefaults.size = new Size(60, 30)
    completeGraph.nodeDefaults.shareStyleInstance = false
    completeGraph.nodeDefaults.labels.layoutParameter = ExteriorLabelModel.SOUTH

    // Set the converters for the collapsible node styles
    TemplateNodeStyle.CONVERTERS.collapseDemo = {
      // converter function for node background
      backgroundConverter: data => {
        return data && data.collapsed ? '#FF8C00' : '#68B0E3'
      },
      // converter function for node icon
      iconConverter: data => {
        // return data && data.collapsed ? '#expand_icon' : '#collapse_icon'
        return data && data.collapsed ? this.expandIconTemplate : this.collapseIconTemplate
      }
    }

    this.buildTree(completeGraph)

    completeGraph.nodes.forEach(node => {
      // Initially, 3 levels are expanded and thus, 4 levels are visible
      node.style.styleTag = { collapsed: node.tag.level > 2 }
      this.nodeCollapsedMap.set(node, node.tag.level > 2)
      this.nodeVisibility.set(node, node.tag.level < 4)

      // Set a different style to leaf nodes
      if (completeGraph.outDegree(node) === 0) {
        completeGraph.setStyle(node, leafNodeStyle)
      }
    })

    // Create a filtered graph of the original graph that contains only non-collapsed sub-parts.
    // The predicate methods specify which should be part of the filtered graph.
    return new FilteredGraphWrapper(
      completeGraph,
      node => !!this.nodeVisibility.get(node),
      () => true
    )
  }

  initializeLayouts() {
    const balloonLayout = new BalloonLayout()
    balloonLayout.fromSketchMode = true
    balloonLayout.compactnessFactor = 1.0
    balloonLayout.allowOverlaps = true
    this.layoutAlgorithms.set('Balloon', balloonLayout)

    const organicLayout = new OrganicLayout()
    organicLayout.minimumNodeDistance = 100
    organicLayout.preferredEdgeLength = 80
    organicLayout.deterministic = true
    organicLayout.nodeOverlapsAllowed = true
    this.layoutAlgorithms.set('Organic', organicLayout)

    this.layoutAlgorithms.set('Tree', new TreeLayout())

    const hierarchicLayout = new HierarchicLayout()
    hierarchicLayout.layoutOrientation = LayoutOrientation.TOP_TO_BOTTOM
    hierarchicLayout.nodePlacer.barycenterMode = true
    this.layoutAlgorithms.set('Hierarchic', hierarchicLayout)

    // For a nice layout animation, we use PlaceNodesAtBarycenterStage to make sure new nodes
    // appear at the position of their parent and FixNodeLayoutStage to keep the clicked node
    // at its current location. StraightLineEdgeRouter will remove the bends.
    this.layoutAlgorithms.forEach(layout => {
      const edgeRouter = new StraightLineEdgeRouter()
      edgeRouter.scope = Scope.ROUTE_EDGES_AT_AFFECTED_NODES
      layout.prependStage(new PlaceNodesAtBarycenterStage())
      layout.prependStage(edgeRouter)
      layout.prependStage(new FixNodeLayoutStage())
    })
  }

  initializeInputModes() {
    const graphComponent = this.graphComponent
    const graphViewerInputMode = new GraphViewerInputMode({
      selectableItems: GraphItemTypes.NONE,
      clickableItems: GraphItemTypes.NODE
    })

    // Add an event listener that expands or collapses the clicked node.
    graphViewerInputMode.addItemClickedListener((sender, args) => {
      if (!INode.isInstance(args.item)) {
        return
      }
      const node = args.item
      const filteredGraph = graphComponent.graph
      const canExpand = filteredGraph.outDegree(node) !== filteredGraph.wrappedGraph.outDegree(node)
      if (canExpand) {
        this.expand(node)
      } else {
        this.collapse(node)
      }
    })
    graphComponent.inputMode = graphViewerInputMode

    graphComponent.selectionIndicatorManager.enabled = false
    graphComponent.focusIndicatorManager.enabled = false
    graphComponent.highlightIndicatorManager.enabled = false
  }

  expand(node) {
    // Stores the collapsed state of the node in the style tag in order
    // to be able to bind to it using a template binding.
    node.style.styleTag = { collapsed: false }
    this.nodeCollapsedMap.set(node, false)

    const filteredGraph = this.graphComponent.graph
    this.getDescendants(filteredGraph.wrappedGraph, node, succ => this.nodeCollapsedMap.get(succ)).forEach(
      succ => {
        this.nodeVisibility.set(succ, true)
      }
    )

    filteredGraph.nodePredicateChanged()
    this.runLayout(node, true)
  }

  collapse(node) {
    node.style.styleTag = { collapsed: true }
    this.nodeCollapsedMap.set(node, true)

    const filteredGraph = this.graphComponent.graph
    this.getDescendants(filteredGraph.wrappedGraph, node, succ => this.nodeCollapsedMap.get(succ)).forEach(
      succ => {
        this.nodeVisibility.set(succ, false)
      }
    )

    this.runLayout(node, false).then(() => {
      filteredGraph.nodePredicateChanged()
    })
  }


  runLayout(toggledNode, expand) {
    if (this.runningLayout) {
      return Promise.resolve()
    }
    this.runningLayout = true

    const selectedLayout = this.props.layoutMode ? this.props.layoutMode : 'Hierarchic'

    const graph = this.graphComponent.graph
    const currentLayout = this.layoutAlgorithms.get(selectedLayout)
    const layoutExecutor = new LayoutExecutor(this.graphComponent, currentLayout)
    layoutExecutor.layoutData = new CompositeLayoutData()

    if (toggledNode) {
      // Keep the clicked node at its location
      const fixNodeLayoutData = new FixNodeLayoutData()
      fixNodeLayoutData.fixedNode.item = toggledNode
      layoutExecutor.layoutData.items.add(fixNodeLayoutData)

      const incrementalNodes = this.getDescendants(graph, toggledNode)
      const incrementalMap = new YMap()
      incrementalNodes.forEach(node => {
        incrementalMap.set(node, true)
      })

      if (expand) {
        // move the incremental nodes between their neighbors before expanding for a smooth animation
        this.prepareSmoothExpandLayoutAnimation(incrementalMap)
      } else {
        // configure StraightLineEdgeRouter and PlaceNodesAtBarycenterStage for a smooth animation
        const straightLineEdgeRouterData = new StraightLineEdgeRouterData()
        straightLineEdgeRouterData.affectedNodes.delegate = node => incrementalMap.has(node)
        layoutExecutor.layoutData.items.add(straightLineEdgeRouterData)
        const placeNodesAtBarycenterStageData = new PlaceNodesAtBarycenterStageData()
        placeNodesAtBarycenterStageData.affectedNodes.delegate = node => incrementalMap.has(node)
        layoutExecutor.layoutData.items.add(placeNodesAtBarycenterStageData)
      }

      if (currentLayout instanceof OrganicLayout) {
        currentLayout.scope = OrganicScope.MAINLY_SUBSET

        const layoutData = new OrganicLayoutData()
        layoutData.affectedNodes.source = graph.nodes.toList()
        layoutExecutor.layoutData.items.add(layoutData)
      } else if (currentLayout instanceof HierarchicLayout) {
        currentLayout.layoutMode = LayoutMode.INCREMENTAL

        const layoutData = new HierarchicLayoutData()
        layoutData.incrementalHints.incrementalLayeringNodes.source = incrementalNodes
        layoutExecutor.layoutData.items.add(layoutData)
      }
    } else {
      if (currentLayout instanceof OrganicLayout) {
        currentLayout.scope = OrganicScope.ALL
      } else if (currentLayout instanceof HierarchicLayout) {
        currentLayout.layoutMode = LayoutMode.FROM_SCRATCH
      }
    }

    // eslint-disable-next-line no-eq-null,eqeqeq
    layoutExecutor.animateViewport = toggledNode == null
    layoutExecutor.duration = '0.3s'
    return layoutExecutor
      .start()
      .then(() => {
        this.runningLayout = false
      })
      .catch(error => {
        if (typeof window.reportError === 'function') {
          window.reportError(error)
        }
      })
  }

  prepareSmoothExpandLayoutAnimation(incrementalMap) {
    const graph = this.graphComponent.graph

    // mark the new nodes and place them between their neighbors
    const straightLineEdgeRouterData = new StraightLineEdgeRouterData()
    straightLineEdgeRouterData.affectedNodes.delegate = node => incrementalMap.has(node)
    const placeNodesAtBarycenterStageData = new PlaceNodesAtBarycenterStageData()
    placeNodesAtBarycenterStageData.affectedNodes.delegate = node => incrementalMap.has(node)
    const layoutData = new CompositeLayoutData()
    layoutData.items = [straightLineEdgeRouterData, placeNodesAtBarycenterStageData]

    const layout = new SequentialLayout()
    const edgeRouter = new StraightLineEdgeRouter()
    edgeRouter.scope = Scope.ROUTE_EDGES_AT_AFFECTED_NODES
    layout.appendLayout(edgeRouter)
    layout.appendLayout(new PlaceNodesAtBarycenterStage())

    graph.applyLayout(layout, layoutData)
  }

  getDescendants(graph, node, recursionFilter) {
    const visited = new YMap()
    const descendants = new List()
    const nodes = [node]
    while (nodes.length > 0) {
      graph.successors(nodes.pop()).forEach(s => {
        if (!visited.get(s)) {
          visited.set(s, true)
          descendants.add(s)
          // eslint-disable-next-line no-eq-null,eqeqeq
          if (recursionFilter == null || !recursionFilter(s)) {
            nodes.push(s)
          }
        }
      })
    }
    return descendants
  }

  buildTree(graph) {
    let nodesSource;
    if (!this.props.data) {
      console.warn('Using hardcoded data, because \'this.props.data\' was undefined')
      nodesSource = [{
        level: 0,
        children: [{
          level: 1,
          children: [{level: 2}, {level: 2}]
        }, {
          level: 1,
          children: [{level: 2}, {level: 2}, {level: 2}, {level: 2}]
        }, {
          level: 1,
          children: [{
            level: 2,
            children: [{level: 3}, {level: 3}]
          }, {
            level: 2,
            children: [{level: 3}, {level: 3}]
          }]
        }]
      }]
    } else {
      nodesSource = this.props.data
    }

    const treeBuilder = new TreeBuilder(graph)
    treeBuilder.nodesSource = nodesSource
    treeBuilder.childBinding = 'children'
    treeBuilder.buildGraph()
  }

  render() {
    const {id, data, layoutMode, setProps} = this.props

    return (
      <div id={id} style={{width: '100%', height: '100%'}} ref={node => {this.div = node}}></div>
  )
  }
}

GraphComponentReact.propTypes = {
  /**
   * The ID used to identify this component in Dash callbacks
   */
  id: PropTypes.string,

  /**
   * The graph data that is used with the TreeBuilder
   */
  data: PropTypes.array,

  /**
   * The Layout mode: 'Organic' | 'Balloon' | 'Tree' | 'Hierarchic'
   */
  layoutMode: PropTypes.string,

  /**
   * Dash-assigned callback that should be called whenever any of the
   * properties change
   */
  setProps: PropTypes.func
};
