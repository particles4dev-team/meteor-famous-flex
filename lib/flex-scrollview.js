(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof ijzerenhein === 'undefined') {
    ijzerenhein = {};
}

ijzerenhein.FlexScrollView = require('./src/FlexScrollView');
ijzerenhein.FlowLayoutNode = require('./src/FlowLayoutNode');
ijzerenhein.LayoutContext = require('./src/LayoutContext');
ijzerenhein.LayoutController = require('./src/LayoutController');
ijzerenhein.LayoutNode = require('./src/LayoutNode');
ijzerenhein.LayoutNodeManager = require('./src/LayoutNodeManager');
ijzerenhein.LayoutUtility = require('./src/LayoutUtility');
ijzerenhein.ScrollController = require('./src/ScrollController');
//ijzerenhein.ScrollView = require('./src/ScrollView');

ijzerenhein.layout = ijzerenhein.layout || {};

ijzerenhein.layout.CollectionLayout = require('./src/layouts/CollectionLayout');
ijzerenhein.layout.CoverLayout = require('./src/layouts/CoverLayout');
ijzerenhein.layout.CubeLayout = require('./src/layouts/CubeLayout');
ijzerenhein.layout.GridLayout = require('./src/layouts/GridLayout');
ijzerenhein.layout.HeaderFooterLayout = require('./src/layouts/HeaderFooterLayout');
ijzerenhein.layout.ListLayout = require('./src/layouts/ListLayout');
ijzerenhein.layout.NavBarLayout = require('./src/layouts/NavBarLayout');
//ijzerenhein.layout.TableLayout = require('./src/layouts/TableLayout');

ijzerenhein.helpers = ijzerenhein.helpers || {};

ijzerenhein.helpers.LayoutDockHelper = require('./src/helpers/LayoutDockHelper');

},{"./src/FlexScrollView":2,"./src/FlowLayoutNode":3,"./src/LayoutContext":4,"./src/LayoutController":5,"./src/LayoutNode":6,"./src/LayoutNodeManager":7,"./src/LayoutUtility":8,"./src/ScrollController":9,"./src/helpers/LayoutDockHelper":10,"./src/layouts/CollectionLayout":11,"./src/layouts/CoverLayout":12,"./src/layouts/CubeLayout":13,"./src/layouts/GridLayout":14,"./src/layouts/HeaderFooterLayout":15,"./src/layouts/ListLayout":16,"./src/layouts/NavBarLayout":17}],2:[function(require,module,exports){
var LayoutUtility = require('./LayoutUtility');
var ScrollController = require('./ScrollController');
var ListLayout = require('./layouts/ListLayout');
var PullToRefreshState = {
        HIDDEN: 0,
        PULLING: 1,
        ACTIVE: 2,
        COMPLETED: 3,
        HIDDING: 4
    };
function FlexScrollView(options) {
    ScrollController.call(this, LayoutUtility.combineOptions(FlexScrollView.DEFAULT_OPTIONS, options));
    this._thisScrollViewDelta = 0;
    this._leadingScrollViewDelta = 0;
    this._trailingScrollViewDelta = 0;
}
FlexScrollView.prototype = Object.create(ScrollController.prototype);
FlexScrollView.prototype.constructor = FlexScrollView;
FlexScrollView.PullToRefreshState = PullToRefreshState;
FlexScrollView.DEFAULT_OPTIONS = {
    layout: ListLayout,
    direction: undefined,
    paginated: false,
    alignment: 0,
    flow: false,
    mouseMove: false,
    useContainer: false,
    visibleItemThresshold: 0.5,
    pullToRefreshHeader: undefined,
    pullToRefreshFooter: undefined,
    leadingScrollView: undefined,
    trailingScrollView: undefined
};
FlexScrollView.prototype.setOptions = function (options) {
    ScrollController.prototype.setOptions.call(this, options);
    if (options.pullToRefreshHeader || options.pullToRefreshFooter || this._pullToRefresh) {
        if (options.pullToRefreshHeader) {
            this._pullToRefresh = this._pullToRefresh || [
                undefined,
                undefined
            ];
            if (!this._pullToRefresh[0]) {
                this._pullToRefresh[0] = {
                    state: PullToRefreshState.HIDDEN,
                    prevState: PullToRefreshState.HIDDEN,
                    footer: false
                };
            }
            this._pullToRefresh[0].node = options.pullToRefreshHeader;
        } else if (!this.options.pullToRefreshHeader && this._pullToRefresh) {
            this._pullToRefresh[0] = undefined;
        }
        if (options.pullToRefreshFooter) {
            this._pullToRefresh = this._pullToRefresh || [
                undefined,
                undefined
            ];
            if (!this._pullToRefresh[1]) {
                this._pullToRefresh[1] = {
                    state: PullToRefreshState.HIDDEN,
                    prevState: PullToRefreshState.HIDDEN,
                    footer: true
                };
            }
            this._pullToRefresh[1].node = options.pullToRefreshFooter;
        } else if (!this.options.pullToRefreshFooter && this._pullToRefresh) {
            this._pullToRefresh[1] = undefined;
        }
        if (this._pullToRefresh && !this._pullToRefresh[0] && !this._pullToRefresh[1]) {
            this._pullToRefresh = undefined;
        }
    }
    return this;
};
FlexScrollView.prototype.sequenceFrom = function (node) {
    return this.setDataSource(node);
};
FlexScrollView.prototype.getCurrentIndex = function getCurrentIndex() {
    var item = this.getFirstVisibleItem();
    return item ? item.viewSequence.getIndex() : -1;
};
FlexScrollView.prototype.goToPage = function goToPage(index) {
    var viewSequence = this._viewSequence;
    if (!viewSequence) {
        return this;
    }
    while (viewSequence.getIndex() < index) {
        viewSequence = viewSequence.getNext();
        if (!viewSequence) {
            return this;
        }
    }
    while (viewSequence.getIndex() > index) {
        viewSequence = viewSequence.getPrevious();
        if (!viewSequence) {
            return this;
        }
    }
    this.goToRenderNode(viewSequence.get());
    return this;
};
FlexScrollView.prototype.getOffset = function () {
    return this._scrollOffsetCache;
};
FlexScrollView.prototype.getPosition = FlexScrollView.prototype.getOffset;
function _setPullToRefreshState(pullToRefresh, state) {
    if (pullToRefresh.state !== state) {
        pullToRefresh.state = state;
        if (pullToRefresh.node && pullToRefresh.node.setPullToRefreshStatus) {
            pullToRefresh.node.setPullToRefreshStatus(state);
        }
    }
}
function _getPullToRefresh(footer) {
    return this._pullToRefresh ? this._pullToRefresh[footer ? 1 : 0] : undefined;
}
FlexScrollView.prototype._postLayout = function (size, scrollOffset) {
    if (!this._pullToRefresh) {
        return;
    }
    if (this.options.alignment) {
        scrollOffset += size[this._direction];
    }
    var prevHeight;
    var nextHeight;
    var totalHeight;
    for (var i = 0; i < 2; i++) {
        var pullToRefresh = this._pullToRefresh[i];
        if (pullToRefresh) {
            var length = pullToRefresh.node.getSize()[this._direction];
            var pullLength = pullToRefresh.node.getPullToRefreshSize ? pullToRefresh.node.getPullToRefreshSize()[this._direction] : length;
            var offset;
            if (!pullToRefresh.footer) {
                prevHeight = this._calcScrollHeight(false);
                prevHeight = prevHeight === undefined ? -1 : prevHeight;
                offset = prevHeight >= 0 ? scrollOffset - prevHeight : prevHeight;
                if (this.options.alignment) {
                    nextHeight = this._calcScrollHeight(true);
                    nextHeight = nextHeight === undefined ? -1 : nextHeight;
                    totalHeight = prevHeight >= 0 && nextHeight >= 0 ? prevHeight + nextHeight : -1;
                    if (totalHeight >= 0 && totalHeight < size[this._direction]) {
                        offset = Math.round(scrollOffset - size[this._direction] + nextHeight);
                    }
                }
            } else {
                nextHeight = nextHeight === undefined ? nextHeight = this._calcScrollHeight(true) : nextHeight;
                nextHeight = nextHeight === undefined ? -1 : nextHeight;
                offset = nextHeight >= 0 ? scrollOffset + nextHeight : size[this._direction] + 1;
                if (!this.options.alignment) {
                    prevHeight = prevHeight === undefined ? this._calcScrollHeight(false) : prevHeight;
                    prevHeight = prevHeight === undefined ? -1 : prevHeight;
                    totalHeight = prevHeight >= 0 && nextHeight >= 0 ? prevHeight + nextHeight : -1;
                    if (totalHeight >= 0 && totalHeight < size[this._direction]) {
                        offset = Math.round(scrollOffset - prevHeight + size[this._direction]);
                    }
                }
                offset = -(offset - size[this._direction]);
            }
            var visiblePerc = Math.max(Math.min(offset / pullLength, 1), 0);
            switch (pullToRefresh.state) {
            case PullToRefreshState.HIDDEN:
                if (this._scroll.scrollForceCount) {
                    if (visiblePerc >= 1) {
                        _setPullToRefreshState(pullToRefresh, PullToRefreshState.ACTIVE);
                    } else if (offset >= 0.2) {
                        _setPullToRefreshState(pullToRefresh, PullToRefreshState.PULLING);
                    }
                }
                break;
            case PullToRefreshState.PULLING:
                if (this._scroll.scrollForceCount && visiblePerc >= 1) {
                    _setPullToRefreshState(pullToRefresh, PullToRefreshState.ACTIVE);
                } else if (offset < 0.2) {
                    _setPullToRefreshState(pullToRefresh, PullToRefreshState.HIDDEN);
                }
                break;
            case PullToRefreshState.ACTIVE:
                break;
            case PullToRefreshState.COMPLETED:
                if (!this._scroll.scrollForceCount) {
                    if (offset >= 0.2) {
                        _setPullToRefreshState(pullToRefresh, PullToRefreshState.HIDDING);
                    } else {
                        _setPullToRefreshState(pullToRefresh, PullToRefreshState.HIDDEN);
                    }
                }
                break;
            case PullToRefreshState.HIDDING:
                if (offset < 0.2) {
                    _setPullToRefreshState(pullToRefresh, PullToRefreshState.HIDDEN);
                }
                break;
            }
            if (pullToRefresh.state !== PullToRefreshState.HIDDEN) {
                var contextNode = {
                        renderNode: pullToRefresh.node,
                        prev: !pullToRefresh.footer,
                        next: pullToRefresh.footer,
                        index: !pullToRefresh.footer ? --this._nodes._contextState.prevGetIndex : ++this._nodes._contextState.nextGetIndex
                    };
                var scrollLength;
                if (pullToRefresh.state === PullToRefreshState.ACTIVE) {
                    scrollLength = length;
                } else if (this._scroll.scrollForceCount) {
                    scrollLength = Math.min(offset, length);
                }
                var set = {
                        size: [
                            size[0],
                            size[1]
                        ],
                        translate: [
                            0,
                            0,
                            -0.001
                        ],
                        scrollLength: scrollLength
                    };
                set.size[this._direction] = Math.max(Math.min(offset, pullLength), 0);
                set.translate[this._direction] = pullToRefresh.footer ? size[this._direction] - length : 0;
                this._nodes._context.set(contextNode, set);
            }
        }
    }
};
FlexScrollView.prototype.showPullToRefresh = function (footer) {
    var pullToRefresh = _getPullToRefresh.call(this, footer);
    if (pullToRefresh) {
        _setPullToRefreshState(pullToRefresh, PullToRefreshState.ACTIVE);
        this._scroll.scrollDirty = true;
    }
};
FlexScrollView.prototype.hidePullToRefresh = function (footer) {
    var pullToRefresh = _getPullToRefresh.call(this, footer);
    if (pullToRefresh && pullToRefresh.state === PullToRefreshState.ACTIVE) {
        _setPullToRefreshState(pullToRefresh, PullToRefreshState.COMPLETED);
        this._scroll.scrollDirty = true;
    }
    return this;
};
FlexScrollView.prototype.isPullToRefreshVisible = function (footer) {
    var pullToRefresh = _getPullToRefresh.call(this, footer);
    return pullToRefresh ? pullToRefresh.state === PullToRefreshState.ACTIVE : false;
};
FlexScrollView.prototype.applyScrollForce = function (delta) {
    var leadingScrollView = this.options.leadingScrollView;
    var trailingScrollView = this.options.trailingScrollView;
    if (!leadingScrollView && !trailingScrollView) {
        return ScrollController.prototype.applyScrollForce.call(this, delta);
    }
    var partialDelta;
    if (delta < 0) {
        if (leadingScrollView) {
            partialDelta = leadingScrollView.canScroll(delta);
            this._leadingScrollViewDelta += partialDelta;
            leadingScrollView.applyScrollForce(partialDelta);
            delta -= partialDelta;
        }
        if (trailingScrollView) {
            partialDelta = this.canScroll(delta);
            ScrollController.prototype.applyScrollForce.call(this, partialDelta);
            this._thisScrollViewDelta += partialDelta;
            delta -= partialDelta;
            trailingScrollView.applyScrollForce(delta);
            this._trailingScrollViewDelta += delta;
        } else {
            ScrollController.prototype.applyScrollForce.call(this, delta);
            this._thisScrollViewDelta += delta;
        }
    } else {
        if (trailingScrollView) {
            partialDelta = trailingScrollView.canScroll(delta);
            trailingScrollView.applyScrollForce(partialDelta);
            this._trailingScrollViewDelta += partialDelta;
            delta -= partialDelta;
        }
        if (leadingScrollView) {
            partialDelta = this.canScroll(delta);
            ScrollController.prototype.applyScrollForce.call(this, partialDelta);
            this._thisScrollViewDelta += partialDelta;
            delta -= partialDelta;
            leadingScrollView.applyScrollForce(delta);
            this._leadingScrollViewDelta += delta;
        } else {
            ScrollController.prototype.applyScrollForce.call(this, delta);
            this._thisScrollViewDelta += delta;
        }
    }
    return this;
};
FlexScrollView.prototype.updateScrollForce = function (prevDelta, newDelta) {
    var leadingScrollView = this.options.leadingScrollView;
    var trailingScrollView = this.options.trailingScrollView;
    if (!leadingScrollView && !trailingScrollView) {
        return ScrollController.prototype.updateScrollForce.call(this, prevDelta, newDelta);
    }
    var partialDelta;
    var delta = newDelta - prevDelta;
    if (delta < 0) {
        if (leadingScrollView) {
            partialDelta = leadingScrollView.canScroll(delta);
            leadingScrollView.updateScrollForce(this._leadingScrollViewDelta, this._leadingScrollViewDelta + partialDelta);
            this._leadingScrollViewDelta += partialDelta;
            delta -= partialDelta;
        }
        if (trailingScrollView && delta) {
            partialDelta = this.canScroll(delta);
            ScrollController.prototype.updateScrollForce.call(this, this._thisScrollViewDelta, this._thisScrollViewDelta + partialDelta);
            this._thisScrollViewDelta += partialDelta;
            delta -= partialDelta;
            this._trailingScrollViewDelta += delta;
            trailingScrollView.updateScrollForce(this._trailingScrollViewDelta, this._trailingScrollViewDelta + delta);
        } else if (delta) {
            ScrollController.prototype.updateScrollForce.call(this, this._thisScrollViewDelta, this._thisScrollViewDelta + delta);
            this._thisScrollViewDelta += delta;
        }
    } else {
        if (trailingScrollView) {
            partialDelta = trailingScrollView.canScroll(delta);
            trailingScrollView.updateScrollForce(this._trailingScrollViewDelta, this._trailingScrollViewDelta + partialDelta);
            this._trailingScrollViewDelta += partialDelta;
            delta -= partialDelta;
        }
        if (leadingScrollView) {
            partialDelta = this.canScroll(delta);
            ScrollController.prototype.updateScrollForce.call(this, this._thisScrollViewDelta, this._thisScrollViewDelta + partialDelta);
            this._thisScrollViewDelta += partialDelta;
            delta -= partialDelta;
            leadingScrollView.updateScrollForce(this._leadingScrollViewDelta, this._leadingScrollViewDelta + delta);
            this._leadingScrollViewDelta += delta;
        } else {
            ScrollController.prototype.updateScrollForce.call(this, this._thisScrollViewDelta, this._thisScrollViewDelta + delta);
            this._thisScrollViewDelta += delta;
        }
    }
    return this;
};
FlexScrollView.prototype.releaseScrollForce = function (delta, velocity) {
    var leadingScrollView = this.options.leadingScrollView;
    var trailingScrollView = this.options.trailingScrollView;
    if (!leadingScrollView && !trailingScrollView) {
        return ScrollController.prototype.releaseScrollForce.call(this, delta, velocity);
    }
    var partialDelta;
    if (delta < 0) {
        if (leadingScrollView) {
            partialDelta = Math.max(this._leadingScrollViewDelta, delta);
            this._leadingScrollViewDelta -= partialDelta;
            delta -= partialDelta;
            leadingScrollView.releaseScrollForce(this._leadingScrollViewDelta, delta ? 0 : velocity);
        }
        if (trailingScrollView) {
            partialDelta = Math.max(this._thisScrollViewDelta, delta);
            this._thisScrollViewDelta -= partialDelta;
            delta -= partialDelta;
            ScrollController.prototype.releaseScrollForce.call(this, this._thisScrollViewDelta, delta ? 0 : velocity);
            this._trailingScrollViewDelta -= delta;
            trailingScrollView.releaseScrollForce(this._trailingScrollViewDelta, delta ? velocity : 0);
        } else {
            this._thisScrollViewDelta -= delta;
            ScrollController.prototype.releaseScrollForce.call(this, this._thisScrollViewDelta, delta ? velocity : 0);
        }
    } else {
        if (trailingScrollView) {
            partialDelta = Math.min(this._trailingScrollViewDelta, delta);
            this._trailingScrollViewDelta -= partialDelta;
            delta -= partialDelta;
            trailingScrollView.releaseScrollForce(this._trailingScrollViewDelta, delta ? 0 : velocity);
        }
        if (leadingScrollView) {
            partialDelta = Math.min(this._thisScrollViewDelta, delta);
            this._thisScrollViewDelta -= partialDelta;
            delta -= partialDelta;
            ScrollController.prototype.releaseScrollForce.call(this, this._thisScrollViewDelta, delta ? 0 : velocity);
            this._leadingScrollViewDelta -= delta;
            leadingScrollView.releaseScrollForce(this._leadingScrollViewDelta, delta ? velocity : 0);
        } else {
            this._thisScrollViewDelta -= delta;
            ScrollController.prototype.updateScrollForce.call(this, this._thisScrollViewDelta, delta ? velocity : 0);
        }
    }
    return this;
};
FlexScrollView.prototype.commit = function (context) {
    var result = ScrollController.prototype.commit.call(this, context);
    if (this._pullToRefresh) {
        for (var i = 0; i < 2; i++) {
            var pullToRefresh = this._pullToRefresh[i];
            if (pullToRefresh) {
                if (pullToRefresh.state === PullToRefreshState.ACTIVE && pullToRefresh.prevState !== PullToRefreshState.ACTIVE) {
                    this._eventOutput.emit('refresh', {
                        target: this,
                        footer: pullToRefresh.footer
                    });
                }
                pullToRefresh.prevState = pullToRefresh.state;
            }
        }
    }
    return result;
};
module.exports = FlexScrollView;
},{"./LayoutUtility":8,"./ScrollController":9,"./layouts/ListLayout":16}],3:[function(require,module,exports){
(function (global){
var OptionsManager = typeof window !== 'undefined' ? window.famous.core.OptionsManager : typeof global !== 'undefined' ? global.famous.core.OptionsManager : null;
var Transform = typeof window !== 'undefined' ? window.famous.core.Transform : typeof global !== 'undefined' ? global.famous.core.Transform : null;
var Vector = typeof window !== 'undefined' ? window.famous.math.Vector : typeof global !== 'undefined' ? global.famous.math.Vector : null;
var Particle = typeof window !== 'undefined' ? window.famous.physics.bodies.Particle : typeof global !== 'undefined' ? global.famous.physics.bodies.Particle : null;
var Spring = typeof window !== 'undefined' ? window.famous.physics.forces.Spring : typeof global !== 'undefined' ? global.famous.physics.forces.Spring : null;
var PhysicsEngine = typeof window !== 'undefined' ? window.famous.physics.PhysicsEngine : typeof global !== 'undefined' ? global.famous.physics.PhysicsEngine : null;
var LayoutNode = require('./LayoutNode');
var Transitionable = typeof window !== 'undefined' ? window.famous.transitions.Transitionable : typeof global !== 'undefined' ? global.famous.transitions.Transitionable : null;
function FlowLayoutNode(renderNode, spec) {
    LayoutNode.apply(this, arguments);
    if (!this.options) {
        this.options = Object.create(this.constructor.DEFAULT_OPTIONS);
        this._optionsManager = new OptionsManager(this.options);
    }
    if (!this._pe) {
        this._pe = new PhysicsEngine();
        this._pe.sleep();
    }
    if (!this._properties) {
        this._properties = {};
    } else {
        for (var propName in this._properties) {
            this._properties[propName].init = false;
        }
    }
    if (!this._lockTransitionable) {
        this._lockTransitionable = new Transitionable(1);
    } else {
        this._lockTransitionable.halt();
        this._lockTransitionable.reset(1);
    }
    this._specModified = true;
    this._initial = true;
    if (spec) {
        this.setSpec(spec);
    }
}
FlowLayoutNode.prototype = Object.create(LayoutNode.prototype);
FlowLayoutNode.prototype.constructor = FlowLayoutNode;
FlowLayoutNode.DEFAULT_OPTIONS = {
    spring: {
        dampingRatio: 0.8,
        period: 300
    },
    particleRounding: 0.001
};
var DEFAULT = {
        opacity: 1,
        opacity2D: [
            1,
            0
        ],
        size: [
            0,
            0
        ],
        origin: [
            0,
            0
        ],
        align: [
            0,
            0
        ],
        scale: [
            1,
            1,
            1
        ],
        translate: [
            0,
            0,
            0
        ],
        rotate: [
            0,
            0,
            0
        ],
        skew: [
            0,
            0,
            0
        ]
    };
FlowLayoutNode.prototype.setOptions = function (options) {
    this._optionsManager.setOptions(options);
    var wasSleeping = this._pe.isSleeping();
    for (var propName in this._properties) {
        var prop = this._properties[propName];
        if (prop.force) {
            prop.force.setOptions(prop.force);
        }
    }
    if (wasSleeping) {
        this._pe.sleep();
    }
    return this;
};
FlowLayoutNode.prototype.setSpec = function (spec) {
    var set;
    if (spec.transform) {
        set = Transform.interpret(spec.transform);
    }
    if (!set) {
        set = {};
    }
    set.opacity = spec.opacity;
    set.size = spec.size;
    set.align = spec.align;
    set.origin = spec.origin;
    var oldRemoving = this._removing;
    var oldInvalidated = this._invalidated;
    this.set(set);
    this._removing = oldRemoving;
    this._invalidated = oldInvalidated;
};
FlowLayoutNode.prototype.reset = function () {
    if (this._invalidated) {
        for (var propName in this._properties) {
            this._properties[propName].invalidated = false;
        }
        this._invalidated = false;
    }
    this.trueSizeRequested = false;
    this.usesTrueSize = false;
};
FlowLayoutNode.prototype.remove = function (removeSpec) {
    this._removing = true;
    if (removeSpec) {
        this.setSpec(removeSpec);
    } else {
        this._pe.sleep();
        this._specModified = false;
    }
    this._invalidated = false;
};
FlowLayoutNode.prototype.releaseLock = function (duration) {
    this._lockTransitionable.halt();
    this._lockTransitionable.reset(0);
    this._lockTransitionable.set(1, { duration: duration || this.options.spring.period || 1000 });
};
function _getRoundedValue3D(prop, def, precision) {
    if (!prop || !prop.init) {
        return def;
    }
    precision = precision || this.options.particleRounding;
    var value = prop.particle.getPosition();
    return [
        Math.round(value[0] / precision) * precision,
        Math.round(value[1] / precision) * precision,
        Math.round(value[2] / precision) * precision
    ];
}
FlowLayoutNode.prototype.getSpec = function () {
    var endStateReached = this._pe.isSleeping();
    if (!this._specModified && endStateReached) {
        this._spec.removed = !this._invalidated;
        return this._spec;
    }
    this._initial = false;
    this._specModified = !endStateReached;
    this._spec.removed = false;
    if (!endStateReached) {
        this._pe.step();
    }
    var spec = this._spec;
    var precision = this.options.particleRounding;
    var lockValue = this._lockTransitionable.get();
    var prop = this._properties.opacity;
    if (prop && prop.init) {
        spec.opacity = Math.round(Math.max(0, Math.min(1, prop.curState.x)) / precision) * precision;
    } else {
        spec.opacity = undefined;
    }
    prop = this._properties.size;
    if (prop && prop.init) {
        spec.size = spec.size || [
            0,
            0
        ];
        spec.size[0] = Math.round((prop.curState.x + (prop.endState.x - prop.curState.x) * lockValue) / 0.1) * 0.1;
        spec.size[1] = Math.round((prop.curState.y + (prop.endState.y - prop.curState.y) * lockValue) / 0.1) * 0.1;
    } else {
        spec.size = undefined;
    }
    prop = this._properties.align;
    if (prop && prop.init) {
        spec.align = spec.align || [
            0,
            0
        ];
        spec.align[0] = Math.round((prop.curState.x + (prop.endState.x - prop.curState.x) * lockValue) / 0.1) * 0.1;
        spec.align[1] = Math.round((prop.curState.y + (prop.endState.y - prop.curState.y) * lockValue) / 0.1) * 0.1;
    } else {
        spec.align = undefined;
    }
    prop = this._properties.origin;
    if (prop && prop.init) {
        spec.origin = spec.origin || [
            0,
            0
        ];
        spec.origin[0] = Math.round((prop.curState.x + (prop.endState.x - prop.curState.x) * lockValue) / 0.1) * 0.1;
        spec.origin[1] = Math.round((prop.curState.y + (prop.endState.y - prop.curState.y) * lockValue) / 0.1) * 0.1;
    } else {
        spec.origin = undefined;
    }
    var translate = this._properties.translate;
    var translateX;
    var translateY;
    var translateZ;
    if (translate && translate.init) {
        translateX = Math.round((translate.curState.x + (translate.endState.x - translate.curState.x) * lockValue) / precision) * precision;
        translateY = Math.round((translate.curState.y + (translate.endState.y - translate.curState.y) * lockValue) / precision) * precision;
        translateZ = Math.round((translate.curState.z + (translate.endState.z - translate.curState.z) * lockValue) / precision) * precision;
    } else {
        translateX = 0;
        translateY = 0;
        translateZ = 0;
    }
    var scale = this._properties.scale;
    var skew = this._properties.skew;
    var rotate = this._properties.rotate;
    if (scale || skew || rotate) {
        spec.transform = Transform.build({
            translate: [
                translateX,
                translateY,
                translateZ
            ],
            skew: _getRoundedValue3D.call(this, skew, DEFAULT.skew),
            scale: _getRoundedValue3D.call(this, scale, DEFAULT.scale),
            rotate: _getRoundedValue3D.call(this, rotate, DEFAULT.rotate)
        });
    } else if (translate) {
        if (!spec.transform) {
            spec.transform = Transform.translate(translateX, translateY, translateZ);
        } else {
            spec.transform[12] = translateX;
            spec.transform[13] = translateY;
            spec.transform[14] = translateZ;
        }
    } else {
        spec.transform = undefined;
    }
    return this._spec;
};
function _setPropertyValue(prop, propName, endState, defaultValue, immediate, isTranslate) {
    prop = prop || this._properties[propName];
    if (prop && prop.init) {
        prop.invalidated = true;
        var value = defaultValue;
        if (endState !== undefined) {
            value = endState;
        } else if (this._removing) {
            value = prop.particle.getPosition();
        }
        prop.endState.x = value[0];
        prop.endState.y = value.length > 1 ? value[1] : 0;
        prop.endState.z = value.length > 2 ? value[2] : 0;
        if (immediate) {
            prop.curState.x = prop.endState.x;
            prop.curState.y = prop.endState.y;
            prop.curState.z = prop.endState.z;
            prop.velocity.x = 0;
            prop.velocity.y = 0;
            prop.velocity.z = 0;
        } else if (prop.endState.x !== prop.curState.x || prop.endState.y !== prop.curState.y || prop.endState.z !== prop.curState.z) {
            this._pe.wake();
        }
        return;
    } else {
        var wasSleeping = this._pe.isSleeping();
        if (!prop) {
            prop = {
                particle: new Particle({ position: this._initial || immediate ? endState : defaultValue }),
                endState: new Vector(endState)
            };
            prop.curState = prop.particle.position;
            prop.velocity = prop.particle.velocity;
            prop.force = new Spring(this.options.spring);
            prop.force.setOptions({ anchor: prop.endState });
            this._pe.addBody(prop.particle);
            prop.forceId = this._pe.attach(prop.force, prop.particle);
            this._properties[propName] = prop;
        } else {
            prop.particle.setPosition(this._initial || immediate ? endState : defaultValue);
            prop.endState.set(endState);
        }
        if (!this._initial && !immediate) {
            this._pe.wake();
        } else if (wasSleeping) {
            this._pe.sleep();
        }
        prop.init = true;
        prop.invalidated = true;
    }
}
function _getIfNE2D(a1, a2) {
    return a1[0] === a2[0] && a1[1] === a2[1] ? undefined : a1;
}
function _getIfNE3D(a1, a2) {
    return a1[0] === a2[0] && a1[1] === a2[1] && a1[2] === a2[2] ? undefined : a1;
}
FlowLayoutNode.prototype.set = function (set, defaultSize) {
    if (defaultSize) {
        this._removing = false;
    }
    this._invalidated = true;
    this.scrollLength = set.scrollLength;
    this._specModified = true;
    var prop = this._properties.opacity;
    var value = set.opacity === DEFAULT.opacity ? undefined : set.opacity;
    if (value !== undefined || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'opacity', value === undefined ? undefined : [
            value,
            0
        ], DEFAULT.opacity2D);
    }
    prop = this._properties.align;
    value = set.align ? _getIfNE2D(set.align, DEFAULT.align) : undefined;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'align', value, DEFAULT.align);
    }
    prop = this._properties.origin;
    value = set.origin ? _getIfNE2D(set.origin, DEFAULT.origin) : undefined;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'origin', value, DEFAULT.origin);
    }
    prop = this._properties.size;
    value = set.size || defaultSize;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'size', value, defaultSize, this.usesTrueSize);
    }
    prop = this._properties.translate;
    value = set.translate;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'translate', value, DEFAULT.translate, undefined, true);
    }
    prop = this._properties.scale;
    value = set.scale ? _getIfNE3D(set.scale, DEFAULT.scale) : undefined;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'scale', value, DEFAULT.scale);
    }
    prop = this._properties.rotate;
    value = set.rotate ? _getIfNE3D(set.rotate, DEFAULT.rotate) : undefined;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'rotate', value, DEFAULT.rotate);
    }
    prop = this._properties.skew;
    value = set.skew ? _getIfNE3D(set.skew, DEFAULT.skew) : undefined;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'skew', value, DEFAULT.skew);
    }
};
module.exports = FlowLayoutNode;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./LayoutNode":6}],4:[function(require,module,exports){
function LayoutContext(methods) {
    for (var n in methods) {
        this[n] = methods[n];
    }
}
LayoutContext.prototype.size = undefined;
LayoutContext.prototype.direction = undefined;
LayoutContext.prototype.scrollOffset = undefined;
LayoutContext.prototype.scrollStart = undefined;
LayoutContext.prototype.scrollEnd = undefined;
LayoutContext.prototype.next = function () {
};
LayoutContext.prototype.prev = function () {
};
LayoutContext.prototype.get = function (node) {
};
LayoutContext.prototype.set = function (node, set) {
};
LayoutContext.prototype.resolveSize = function (node) {
};
module.exports = LayoutContext;
},{}],5:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var Entity = typeof window !== 'undefined' ? window.famous.core.Entity : typeof global !== 'undefined' ? global.famous.core.Entity : null;
var ViewSequence = typeof window !== 'undefined' ? window.famous.core.ViewSequence : typeof global !== 'undefined' ? global.famous.core.ViewSequence : null;
var OptionsManager = typeof window !== 'undefined' ? window.famous.core.OptionsManager : typeof global !== 'undefined' ? global.famous.core.OptionsManager : null;
var EventHandler = typeof window !== 'undefined' ? window.famous.core.EventHandler : typeof global !== 'undefined' ? global.famous.core.EventHandler : null;
var LayoutUtility = require('./LayoutUtility');
var LayoutNodeManager = require('./LayoutNodeManager');
var LayoutNode = require('./LayoutNode');
var FlowLayoutNode = require('./FlowLayoutNode');
var Transform = typeof window !== 'undefined' ? window.famous.core.Transform : typeof global !== 'undefined' ? global.famous.core.Transform : null;
require('./helpers/LayoutDockHelper');
function LayoutController(options, nodeManager) {
    this.id = Entity.register(this);
    this._isDirty = true;
    this._contextSizeCache = [
        0,
        0
    ];
    this._commitOutput = {};
    this._eventInput = new EventHandler();
    EventHandler.setInputHandler(this, this._eventInput);
    this._eventOutput = new EventHandler();
    EventHandler.setOutputHandler(this, this._eventOutput);
    this._layout = { options: Object.create({}) };
    this._layout.optionsManager = new OptionsManager(this._layout.options);
    this._layout.optionsManager.on('change', function () {
        this._isDirty = true;
    }.bind(this));
    this.options = Object.create(LayoutController.DEFAULT_OPTIONS);
    this._optionsManager = new OptionsManager(this.options);
    if (nodeManager) {
        this._nodes = nodeManager;
    } else if (options && options.flow) {
        this._nodes = new LayoutNodeManager(FlowLayoutNode, _initFlowLayoutNode.bind(this));
    } else {
        this._nodes = new LayoutNodeManager(LayoutNode);
    }
    this.setDirection(undefined);
    if (options) {
        this.setOptions(options);
    }
}
LayoutController.DEFAULT_OPTIONS = {
    nodeSpring: {
        dampingRatio: 0.8,
        period: 300
    },
    reflowOnResize: true
};
function _initFlowLayoutNode(node, spec) {
    if (!spec && this.options.insertSpec) {
        node.setSpec(this.options.insertSpec);
    }
}
LayoutController.prototype.setOptions = function setOptions(options) {
    if (options.alignment !== undefined && options.alignment !== this.options.alignment) {
        this._isDirty = true;
    }
    this._optionsManager.setOptions(options);
    if (options.dataSource) {
        this.setDataSource(options.dataSource);
    }
    if (options.layout || options.layoutOptions) {
        this.setLayout(options.layout, options.layoutOptions);
    }
    if (options.direction !== undefined) {
        this.setDirection(options.direction);
    }
    if (options.nodeSpring && this.options.flow) {
        this._nodes.setNodeOptions({ spring: options.nodeSpring });
    }
    if (options.preallocateNodes) {
        this._nodes.preallocateNodes(options.preallocateNodes.count || 0, options.preallocateNodes.spec);
    }
    return this;
};
function _forEachRenderable(callback) {
    var dataSource = this._dataSource;
    if (dataSource instanceof Array) {
        for (var i = 0, j = dataSource.length; i < j; i++) {
            callback(dataSource[i]);
        }
    } else if (dataSource instanceof ViewSequence) {
        var renderable;
        while (dataSource) {
            renderable = dataSource.get();
            if (!renderable) {
                break;
            }
            callback(renderable);
            dataSource = dataSource.getNext();
        }
    } else {
        for (var key in dataSource) {
            callback(dataSource[key]);
        }
    }
}
LayoutController.prototype.setDataSource = function (dataSource) {
    this._dataSource = dataSource;
    this._nodesById = undefined;
    if (dataSource instanceof Array) {
        this._viewSequence = new ViewSequence(dataSource);
    } else if (dataSource instanceof ViewSequence) {
        this._viewSequence = dataSource;
    } else if (dataSource instanceof Object) {
        this._nodesById = dataSource;
    }
    if (this.options.autoPipeEvents) {
        _forEachRenderable.call(this, function (renderable) {
            if (renderable && renderable.pipe) {
                renderable.pipe(this);
                renderable.pipe(this._eventOutput);
            }
        }.bind(this));
    }
    this._isDirty = true;
    return this;
};
LayoutController.prototype.getDataSource = function () {
    return this._dataSource;
};
LayoutController.prototype.setLayout = function (layout, options) {
    if (layout instanceof Function) {
        this._layout._function = layout;
        this._layout.capabilities = layout.Capabilities;
        this._layout.literal = undefined;
    } else if (layout instanceof Object) {
        this._layout.literal = layout;
        this._layout.capabilities = undefined;
        var helperName = Object.keys(layout)[0];
        var Helper = LayoutUtility.getRegisteredHelper(helperName);
        this._layout._function = Helper ? function (context, options) {
            var helper = new Helper(context, options);
            helper.parse(layout[helperName]);
        } : undefined;
    } else {
        this._layout._function = undefined;
        this._layout.capabilities = undefined;
        this._layout.literal = undefined;
    }
    if (options) {
        this.setLayoutOptions(options);
    }
    this.setDirection(this._configuredDirection);
    this._isDirty = true;
    return this;
};
LayoutController.prototype.getLayout = function () {
    return this._layout.literal || this._layout._function;
};
LayoutController.prototype.setLayoutOptions = function (options) {
    this._layout.optionsManager.setOptions(options);
    return this;
};
LayoutController.prototype.getLayoutOptions = function () {
    return this._layout.options;
};
function _getActualDirection(direction) {
    if (this._layout.capabilities && this._layout.capabilities.direction) {
        if (Array.isArray(this._layout.capabilities.direction)) {
            for (var i = 0; i < this._layout.capabilities.direction.length; i++) {
                if (this._layout.capabilities.direction[i] === direction) {
                    return direction;
                }
            }
            return this._layout.capabilities.direction[0];
        } else {
            return this._layout.capabilities.direction;
        }
    }
    return direction === undefined ? Utility.Direction.Y : direction;
}
LayoutController.prototype.setDirection = function (direction) {
    this._configuredDirection = direction;
    var newDirection = _getActualDirection.call(this, direction);
    if (newDirection !== this._direction) {
        this._direction = newDirection;
        this._isDirty = true;
    }
};
LayoutController.prototype.getDirection = function (actual) {
    return actual ? this._direction : this._configuredDirection;
};
LayoutController.prototype.getSpec = function (node) {
    if (!node) {
        return undefined;
    }
    if (node instanceof String || typeof node === 'string') {
        if (!this._nodesById) {
            return undefined;
        }
        node = this._nodesById[node];
        if (!node) {
            return undefined;
        }
        if (node instanceof Array) {
            return node;
        }
    }
    if (this._specs) {
        for (var i = 0; i < this._specs.length; i++) {
            var spec = this._specs[i];
            if (spec.renderNode === node) {
                return spec;
            }
        }
    }
    return undefined;
};
LayoutController.prototype.reflowLayout = function () {
    this._isDirty = true;
    return this;
};
LayoutController.prototype.insert = function (indexOrId, renderable, insertSpec) {
    if (indexOrId instanceof String || typeof indexOrId === 'string') {
        if (this._dataSource === undefined) {
            this._dataSource = {};
            this._nodesById = this._dataSource;
        }
        this._nodesById[indexOrId] = renderable;
    } else {
        if (this._dataSource === undefined) {
            this._dataSource = [];
            this._viewSequence = new ViewSequence(this._dataSource);
        }
        var dataSource = this._viewSequence || this._dataSource;
        if (indexOrId === -1) {
            dataSource.push(renderable);
        } else if (indexOrId === 0) {
            if (dataSource === this._viewSequence) {
                dataSource.splice(0, 0, renderable);
                if (this._viewSequence.getIndex() === 0) {
                    var nextViewSequence = this._viewSequence.getNext();
                    if (nextViewSequence && nextViewSequence.get()) {
                        this._viewSequence = nextViewSequence;
                    }
                }
            } else {
                dataSource.splice(0, 0, renderable);
            }
        } else {
            dataSource.splice(indexOrId, 0, renderable);
        }
    }
    if (insertSpec) {
        this._nodes.insertNode(this._nodes.createNode(renderable, insertSpec));
    }
    if (this.options.autoPipeEvents && renderable && renderable.pipe) {
        renderable.pipe(this);
        renderable.pipe(this._eventOutput);
    }
    this._isDirty = true;
    return this;
};
LayoutController.prototype.push = function (renderable, insertSpec) {
    return this.insert(-1, renderable, insertSpec);
};
function _getViewSequenceAtIndex(index) {
    var viewSequence = this._viewSequence;
    var i = viewSequence ? viewSequence.getIndex() : index;
    if (index > i) {
        while (viewSequence) {
            viewSequence = viewSequence.getNext();
            if (!viewSequence) {
                return undefined;
            }
            i = viewSequence.getIndex();
            if (i === index) {
                return viewSequence;
            } else if (index < i) {
                return undefined;
            }
        }
    } else if (index < i) {
        while (viewSequence) {
            viewSequence = viewSequence.getPrevious();
            if (!viewSequence) {
                return undefined;
            }
            i = viewSequence.getIndex();
            if (i === index) {
                return viewSequence;
            } else if (index > i) {
                return undefined;
            }
        }
    }
    return viewSequence;
}
LayoutController.prototype.swap = function (index, index2) {
    if (this._viewSequence) {
        _getViewSequenceAtIndex.call(this, index).swap(_getViewSequenceAtIndex.call(this, index2));
        this._isDirty = true;
    }
    return this;
};
LayoutController.prototype.remove = function (indexOrId, removeSpec) {
    var renderNode;
    if (this._nodesById || indexOrId instanceof String || typeof indexOrId === 'string') {
        renderNode = this._nodesById[indexOrId];
        if (renderNode) {
            delete this._nodesById[indexOrId];
        }
    } else {
        renderNode = this._dataSource.splice(indexOrId, 1)[0];
    }
    if (renderNode && removeSpec) {
        var node = this._nodes.getNodeByRenderNode(renderNode);
        if (node) {
            node.remove(removeSpec || this.options.removeSpec);
        }
    }
    if (renderNode) {
        this._isDirty = true;
    }
    return this;
};
LayoutController.prototype.removeAll = function () {
    if (this._nodesById) {
        var dirty = false;
        for (var key in this._nodesById) {
            delete this._nodesById[key];
            dirty = true;
        }
        if (dirty) {
            this._isDirty = true;
        }
    } else if (this._dataSource) {
        this.setDataSource([]);
    }
    return this;
};
LayoutController.prototype.getSize = function () {
    return this._size || this.options.size;
};
LayoutController.prototype.render = function render() {
    return this.id;
};
LayoutController.prototype.commit = function commit(context) {
    var transform = context.transform;
    var origin = context.origin;
    var size = context.size;
    var opacity = context.opacity;
    if (size[0] !== this._contextSizeCache[0] || size[1] !== this._contextSizeCache[1] || this._isDirty || this._nodes._trueSizeRequested || this.options.alwaysLayout) {
        var eventData = {
                target: this,
                oldSize: this._contextSizeCache,
                size: size,
                dirty: this._isDirty,
                trueSizeRequested: this._nodes._trueSizeRequested
            };
        this._eventOutput.emit('layoutstart', eventData);
        if (this.options.flow && (this._isDirty || this.options.reflowOnResize && (size[0] !== this._contextSizeCache[0] || size[1] !== this._contextSizeCache[1]))) {
            var node = this._nodes.getStartEnumNode();
            while (node) {
                node.releaseLock();
                node = node._next;
            }
        }
        this._contextSizeCache[0] = size[0];
        this._contextSizeCache[1] = size[1];
        this._isDirty = false;
        var scrollEnd;
        if (this.options.size && this.options.size[this._direction] === true) {
            scrollEnd = 1000000;
        }
        var layoutContext = this._nodes.prepareForLayout(this._viewSequence, this._nodesById, {
                size: size,
                direction: this._direction,
                scrollEnd: scrollEnd
            });
        if (this._layout._function) {
            this._layout._function(layoutContext, this._layout.options);
        }
        if (scrollEnd) {
            scrollEnd = 0;
            node = this._nodes.getStartEnumNode();
            while (node) {
                if (node._invalidated && node.scrollLength) {
                    scrollEnd += node.scrollLength;
                }
                node = node._next;
            }
            this._size = this._size || [
                0,
                0
            ];
            this._size[0] = this.options.size[0];
            this._size[1] = this.options.size[1];
            this._size[this._direction] = scrollEnd;
        }
        var result = this._nodes.buildSpecAndDestroyUnrenderedNodes();
        this._commitOutput.target = result.specs;
        this._eventOutput.emit('reflow', { target: this });
        this._eventOutput.emit('layoutend', eventData);
    } else if (this.options.flow) {
        result = this._nodes.buildSpecAndDestroyUnrenderedNodes();
        this._commitOutput.target = result.specs;
        if (result.modified) {
            this._eventOutput.emit('reflow', { target: this });
        }
    }
    this._specs = this._commitOutput.target;
    var target = this._commitOutput.target;
    for (var i = 0, j = target.length; i < j; i++) {
        target[i].target = target[i].renderNode.render();
    }
    if (origin && (origin[0] !== 0 || origin[1] !== 0)) {
        transform = Transform.moveThen([
            -size[0] * origin[0],
            -size[1] * origin[1],
            0
        ], transform);
    }
    this._commitOutput.size = size;
    this._commitOutput.opacity = opacity;
    this._commitOutput.transform = transform;
    return this._commitOutput;
};
module.exports = LayoutController;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./FlowLayoutNode":3,"./LayoutNode":6,"./LayoutNodeManager":7,"./LayoutUtility":8,"./helpers/LayoutDockHelper":10}],6:[function(require,module,exports){
(function (global){
var Transform = typeof window !== 'undefined' ? window.famous.core.Transform : typeof global !== 'undefined' ? global.famous.core.Transform : null;
var LayoutUtility = require('./LayoutUtility');
function LayoutNode(renderNode, spec) {
    this.renderNode = renderNode;
    this._spec = spec ? LayoutUtility.cloneSpec(spec) : {};
    this._spec.renderNode = renderNode;
    this._specModified = true;
    this._invalidated = false;
    this._removing = false;
}
LayoutNode.prototype.setOptions = function (options) {
};
LayoutNode.prototype.destroy = function () {
    this.renderNode = undefined;
    this._spec.renderNode = undefined;
    this._viewSequence = undefined;
};
LayoutNode.prototype.reset = function () {
    this._invalidated = false;
    this.trueSizeRequested = false;
};
LayoutNode.prototype.setSpec = function (spec) {
    this._specModified = true;
    if (spec.align) {
        if (!spec.align) {
            this._spec.align = [
                0,
                0
            ];
        }
        this._spec.align[0] = spec.align[0];
        this._spec.align[1] = spec.align[1];
    } else {
        this._spec.align = undefined;
    }
    if (spec.origin) {
        if (!spec.origin) {
            this._spec.origin = [
                0,
                0
            ];
        }
        this._spec.origin[0] = spec.origin[0];
        this._spec.origin[1] = spec.origin[1];
    } else {
        this._spec.origin = undefined;
    }
    if (spec.size) {
        if (!spec.size) {
            this._spec.size = [
                0,
                0
            ];
        }
        this._spec.size[0] = spec.size[0];
        this._spec.size[1] = spec.size[1];
    } else {
        this._spec.size = undefined;
    }
    if (spec.transform) {
        if (!spec.transform) {
            this._spec.transform = spec.transform.slice(0);
        } else {
            for (var i = 0; i < 16; i++) {
                this._spec.transform[0] = spec.transform[0];
            }
        }
    } else {
        this._spec.transform = undefined;
    }
    this._spec.opacity = spec.opacity;
};
LayoutNode.prototype.set = function (set, size) {
    this._invalidated = true;
    this._specModified = true;
    this._removing = false;
    var spec = this._spec;
    spec.opacity = set.opacity;
    if (set.size) {
        if (!spec.size) {
            spec.size = [
                0,
                0
            ];
        }
        spec.size[0] = set.size[0];
        spec.size[1] = set.size[1];
    } else {
        spec.size = undefined;
    }
    if (set.origin) {
        if (!spec.origin) {
            spec.origin = [
                0,
                0
            ];
        }
        spec.origin[0] = set.origin[0];
        spec.origin[1] = set.origin[1];
    } else {
        spec.origin = undefined;
    }
    if (set.align) {
        if (!spec.align) {
            spec.align = [
                0,
                0
            ];
        }
        spec.align[0] = set.align[0];
        spec.align[1] = set.align[1];
    } else {
        spec.align = undefined;
    }
    if (set.skew || set.rotate || set.scale) {
        this._spec.transform = Transform.build({
            translate: set.translate || [
                0,
                0,
                0
            ],
            skew: set.skew || [
                0,
                0,
                0
            ],
            scale: set.scale || [
                1,
                1,
                1
            ],
            rotate: set.rotate || [
                0,
                0,
                0
            ]
        });
    } else if (set.translate) {
        this._spec.transform = Transform.translate(set.translate[0], set.translate[1], set.translate[2]);
    } else {
        this._spec.transform = undefined;
    }
    this.scrollLength = set.scrollLength;
};
LayoutNode.prototype.getSpec = function () {
    this._specModified = false;
    this._spec.removed = !this._invalidated;
    return this._spec;
};
LayoutNode.prototype.remove = function (removeSpec) {
    this._removing = true;
};
module.exports = LayoutNode;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./LayoutUtility":8}],7:[function(require,module,exports){
var LayoutContext = require('./LayoutContext');
var LayoutUtility = require('./LayoutUtility');
var MAX_POOL_SIZE = 100;
function LayoutNodeManager(LayoutNode, initLayoutNodeFn) {
    this.LayoutNode = LayoutNode;
    this._initLayoutNodeFn = initLayoutNodeFn;
    this._layoutCount = 0;
    this._context = new LayoutContext({
        next: _contextNext.bind(this),
        prev: _contextPrev.bind(this),
        get: _contextGet.bind(this),
        set: _contextSet.bind(this),
        resolveSize: _contextResolveSize.bind(this),
        size: [
            0,
            0
        ]
    });
    this._contextState = {};
    this._pool = {
        layoutNodes: { size: 0 },
        resolveSize: [
            0,
            0
        ]
    };
}
LayoutNodeManager.prototype.prepareForLayout = function (viewSequence, nodesById, contextData) {
    var node = this._first;
    while (node) {
        node.reset();
        node = node._next;
    }
    var context = this._context;
    this._layoutCount++;
    this._nodesById = nodesById;
    this._trueSizeRequested = false;
    this._reevalTrueSize = contextData.reevalTrueSize || !context.size || context.size[0] !== contextData.size[0] || context.size[1] !== contextData.size[1];
    var contextState = this._contextState;
    contextState.nextSequence = viewSequence;
    contextState.prevSequence = viewSequence;
    contextState.start = undefined;
    contextState.nextGetIndex = 0;
    contextState.prevGetIndex = 0;
    contextState.nextSetIndex = 0;
    contextState.prevSetIndex = 0;
    contextState.addCount = 0;
    contextState.removeCount = 0;
    context.size[0] = contextData.size[0];
    context.size[1] = contextData.size[1];
    context.direction = contextData.direction;
    context.reverse = contextData.reverse;
    context.alignment = contextData.reverse ? 1 : 0;
    context.scrollOffset = contextData.scrollOffset || 0;
    context.scrollStart = contextData.scrollStart || 0;
    context.scrollEnd = contextData.scrollEnd || context.size[context.direction];
    return context;
};
LayoutNodeManager.prototype.removeNonInvalidatedNodes = function (removeSpec) {
    var node = this._first;
    while (node) {
        if (!node._invalidated && !node._removing) {
            node.remove(removeSpec);
        }
        node = node._next;
    }
};
LayoutNodeManager.prototype.buildSpecAndDestroyUnrenderedNodes = function (translate) {
    var specs = [];
    var result = {
            specs: specs,
            modified: false
        };
    var node = this._first;
    while (node) {
        var modified = node._specModified;
        var spec = node.getSpec();
        if (spec.removed) {
            var destroyNode = node;
            node = node._next;
            _destroyNode.call(this, destroyNode);
            result.modified = true;
        } else {
            if (modified) {
                if (spec.transform && translate) {
                    spec.transform[12] += translate[0];
                    spec.transform[13] += translate[1];
                    spec.transform[14] += translate[2];
                    spec.transform[12] = Math.round(spec.transform[12] * 100000) / 100000;
                    spec.transform[13] = Math.round(spec.transform[13] * 100000) / 100000;
                }
                result.modified = true;
            }
            specs.push(spec);
            node = node._next;
        }
    }
    this._contextState.addCount = 0;
    this._contextState.removeCount = 0;
    return result;
};
LayoutNodeManager.prototype.getNodeByRenderNode = function (renderable) {
    var node = this._first;
    while (node) {
        if (node.renderNode === renderable) {
            return node;
        }
        node = node._next;
    }
    return undefined;
};
LayoutNodeManager.prototype.insertNode = function (node) {
    node._next = this._first;
    if (this._first) {
        this._first._prev = node;
    }
    this._first = node;
};
LayoutNodeManager.prototype.setNodeOptions = function (options) {
    this._nodeOptions = options;
    var node = this._first;
    while (node) {
        node.setOptions(options);
        node = node._next;
    }
    node = this._pool.layoutNodes.first;
    while (node) {
        node.setOptions(options);
        node = node._next;
    }
};
LayoutNodeManager.prototype.preallocateNodes = function (count, spec) {
    var nodes = [];
    for (var i = 0; i < count; i++) {
        nodes.push(this.createNode(undefined, spec));
    }
    for (i = 0; i < count; i++) {
        _destroyNode.call(this, nodes[i]);
    }
};
LayoutNodeManager.prototype.createNode = function (renderNode, spec) {
    var node;
    if (this._pool.layoutNodes.first) {
        node = this._pool.layoutNodes.first;
        this._pool.layoutNodes.first = node._next;
        this._pool.layoutNodes.size--;
        node.constructor.apply(node, arguments);
    } else {
        node = new this.LayoutNode(renderNode, spec);
        if (this._nodeOptions) {
            node.setOptions(this._nodeOptions);
        }
    }
    node._prev = undefined;
    node._next = undefined;
    node._viewSequence = undefined;
    node._layoutCount = 0;
    if (this._initLayoutNodeFn) {
        this._initLayoutNodeFn.call(this, node, spec);
    }
    return node;
};
function _destroyNode(node) {
    if (node._next) {
        node._next._prev = node._prev;
    }
    if (node._prev) {
        node._prev._next = node._next;
    } else {
        this._first = node._next;
    }
    node.destroy();
    if (this._pool.layoutNodes.size < MAX_POOL_SIZE) {
        this._pool.layoutNodes.size++;
        node._prev = undefined;
        node._next = this._pool.layoutNodes.first;
        this._pool.layoutNodes.first = node;
    }
}
LayoutNodeManager.prototype.getStartEnumNode = function (next) {
    if (next === undefined) {
        return this._first;
    } else if (next === true) {
        return this._contextState.start && this._contextState.startPrev ? this._contextState.start._next : this._contextState.start;
    } else if (next === false) {
        return this._contextState.start && !this._contextState.startPrev ? this._contextState.start._prev : this._contextState.start;
    }
};
function _contextGetCreateAndOrderNodes(renderNode, prev) {
    var node;
    var state = this._contextState;
    if (!state.start) {
        node = this._first;
        while (node) {
            if (node.renderNode === renderNode) {
                break;
            }
            node = node._next;
        }
        if (!node) {
            node = this.createNode(renderNode);
            node._next = this._first;
            if (this._first) {
                this._first._prev = node;
            }
            this._first = node;
        }
        state.start = node;
        state.startPrev = prev;
        state.prev = node;
        state.next = node;
        return node;
    }
    if (prev) {
        if (state.prev._prev && state.prev._prev.renderNode === renderNode) {
            state.prev = state.prev._prev;
            return state.prev;
        }
    } else {
        if (state.next._next && state.next._next.renderNode === renderNode) {
            state.next = state.next._next;
            return state.next;
        }
    }
    node = this._first;
    while (node) {
        if (node.renderNode === renderNode) {
            break;
        }
        node = node._next;
    }
    if (!node) {
        node = this.createNode(renderNode);
    } else {
        if (node._next) {
            node._next._prev = node._prev;
        }
        if (node._prev) {
            node._prev._next = node._next;
        } else {
            this._first = node._next;
        }
        node._next = undefined;
        node._prev = undefined;
    }
    if (prev) {
        if (state.prev._prev) {
            node._prev = state.prev._prev;
            state.prev._prev._next = node;
        } else {
            this._first = node;
        }
        state.prev._prev = node;
        node._next = state.prev;
        state.prev = node;
    } else {
        if (state.next._next) {
            node._next = state.next._next;
            state.next._next._prev = node;
        }
        state.next._next = node;
        node._prev = state.next;
        state.next = node;
    }
    return node;
}
function _contextNext() {
    if (!this._contextState.nextSequence) {
        return undefined;
    }
    if (this._context.reverse) {
        this._contextState.nextSequence = this._contextState.nextSequence.getNext();
        if (!this._contextState.nextSequence) {
            return undefined;
        }
    }
    var renderNode = this._contextState.nextSequence.get();
    if (!renderNode) {
        this._contextState.nextSequence = undefined;
        return undefined;
    }
    var nextSequence = this._contextState.nextSequence;
    if (!this._context.reverse) {
        this._contextState.nextSequence = this._contextState.nextSequence.getNext();
    }
    return {
        renderNode: renderNode,
        viewSequence: nextSequence,
        next: true,
        index: ++this._contextState.nextGetIndex
    };
}
function _contextPrev() {
    if (!this._contextState.prevSequence) {
        return undefined;
    }
    if (!this._context.reverse) {
        this._contextState.prevSequence = this._contextState.prevSequence.getPrevious();
        if (!this._contextState.prevSequence) {
            return undefined;
        }
    }
    var renderNode = this._contextState.prevSequence.get();
    if (!renderNode) {
        this._contextState.prevSequence = undefined;
        return undefined;
    }
    var prevSequence = this._contextState.prevSequence;
    if (this._context.reverse) {
        this._contextState.prevSequence = this._contextState.prevSequence.getPrevious();
    }
    return {
        renderNode: renderNode,
        viewSequence: prevSequence,
        prev: true,
        index: --this._contextState.prevGetIndex
    };
}
function _contextGet(contextNodeOrId) {
    if (this._nodesById && (contextNodeOrId instanceof String || typeof contextNodeOrId === 'string')) {
        var renderNode = this._nodesById[contextNodeOrId];
        if (!renderNode) {
            return undefined;
        }
        if (renderNode instanceof Array) {
            var result = [];
            for (var i = 0, j = renderNode.length; i < j; i++) {
                result.push({
                    renderNode: renderNode[i],
                    arrayElement: true
                });
            }
            return result;
        }
        return {
            renderNode: renderNode,
            byId: true
        };
    } else {
        return contextNodeOrId;
    }
}
function _contextSet(contextNodeOrId, set) {
    var contextNode = this._nodesById ? _contextGet.call(this, contextNodeOrId) : contextNodeOrId;
    if (contextNode) {
        var node = contextNode.node;
        if (!node) {
            if (contextNode.next) {
                if (contextNode.index < this._contextState.nextSetIndex) {
                    LayoutUtility.error('Nodes must be layed out in the same order as they were requested!');
                }
                this._contextState.nextSetIndex = contextNode.index;
            } else if (contextNode.prev) {
                if (contextNode.index > this._contextState.prevSetIndex) {
                    LayoutUtility.error('Nodes must be layed out in the same order as they were requested!');
                }
                this._contextState.prevSetIndex = contextNode.index;
            }
            node = _contextGetCreateAndOrderNodes.call(this, contextNode.renderNode, contextNode.prev);
            node._viewSequence = contextNode.viewSequence;
            node._layoutCount++;
            if (node._layoutCount === 1) {
                this._contextState.addCount++;
            }
            contextNode.node = node;
        }
        node.usesTrueSize = contextNode.usesTrueSize;
        node.trueSizeRequested = contextNode.trueSizeRequested;
        node.set(set, this._context.size);
        contextNode.set = set;
    }
}
function _contextResolveSize(contextNodeOrId, parentSize) {
    var contextNode = this._nodesById ? _contextGet.call(this, contextNodeOrId) : contextNodeOrId;
    var resolveSize = this._pool.resolveSize;
    if (!contextNode) {
        resolveSize[0] = 0;
        resolveSize[1] = 0;
        return resolveSize;
    }
    var renderNode = contextNode.renderNode;
    var size = renderNode.getSize();
    if (!size) {
        return parentSize;
    }
    var configSize = renderNode.size && renderNode._trueSizeCheck !== undefined ? renderNode.size : undefined;
    if (configSize && (configSize[0] === true || configSize[1] === true)) {
        contextNode.usesTrueSize = true;
        var backupSize = renderNode._backupSize;
        if (renderNode._trueSizeCheck) {
            if (backupSize && configSize !== size) {
                var newWidth = configSize[0] === true ? Math.max(backupSize[0], size[0]) : size[0];
                var newHeight = configSize[1] === true ? Math.max(backupSize[1], size[1]) : size[1];
                if (newWidth !== backupSize[0] || newHeight !== backupSize[1]) {
                    this._trueSizeRequested = true;
                    contextNode.trueSizeRequested = true;
                }
                backupSize[0] = newWidth;
                backupSize[1] = newHeight;
                size = backupSize;
                renderNode._backupSize = undefined;
                backupSize = undefined;
            } else {
                this._trueSizeRequested = true;
                contextNode.trueSizeRequested = true;
            }
        }
        if (this._reevalTrueSize || backupSize && (backupSize[0] !== size[0] || backupSize[1] !== size[1])) {
            renderNode._trueSizeCheck = true;
            renderNode._sizeDirty = true;
            this._trueSizeRequested = true;
        }
        if (!backupSize) {
            renderNode._backupSize = [
                0,
                0
            ];
            backupSize = renderNode._backupSize;
        }
        backupSize[0] = size[0];
        backupSize[1] = size[1];
    }
    configSize = renderNode._nodes ? renderNode.options.size : undefined;
    if (configSize && (configSize[0] === true || configSize[1] === true)) {
        if (this._reevalTrueSize || renderNode._nodes._trueSizeRequested) {
            contextNode.usesTrueSize = true;
            contextNode.trueSizeRequested = true;
            this._trueSizeRequested = true;
        }
    }
    if (size[0] === undefined || size[0] === true || size[1] === undefined || size[1] === true) {
        resolveSize[0] = size[0];
        resolveSize[1] = size[1];
        size = resolveSize;
        if (size[0] === undefined) {
            size[0] = parentSize[0];
        } else if (size[0] === true) {
            size[0] = 0;
            this._trueSizeRequested = true;
            contextNode.trueSizeRequested = true;
        }
        if (size[1] === undefined) {
            size[1] = parentSize[1];
        } else if (size[1] === true) {
            size[1] = 0;
            this._trueSizeRequested = true;
            contextNode.trueSizeRequested = true;
        }
    }
    return size;
}
module.exports = LayoutNodeManager;
},{"./LayoutContext":4,"./LayoutUtility":8}],8:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
function LayoutUtility() {
}
LayoutUtility.registeredHelpers = {};
var Capabilities = {
        SEQUENCE: 1,
        DIRECTION_X: 2,
        DIRECTION_Y: 4,
        SCROLLING: 8
    };
LayoutUtility.Capabilities = Capabilities;
LayoutUtility.normalizeMargins = function (margins) {
    if (!margins) {
        return [
            0,
            0,
            0,
            0
        ];
    } else if (!Array.isArray(margins)) {
        return [
            margins,
            margins,
            margins,
            margins
        ];
    } else if (margins.length === 0) {
        return [
            0,
            0,
            0,
            0
        ];
    } else if (margins.length === 1) {
        return [
            margins[0],
            margins[0],
            margins[0],
            margins[0]
        ];
    } else if (margins.length === 2) {
        return [
            margins[0],
            margins[1],
            margins[0],
            margins[1]
        ];
    } else {
        return margins;
    }
};
LayoutUtility.cloneSpec = function (spec) {
    var clone = {};
    if (spec.opacity !== undefined) {
        clone.opacity = spec.opacity;
    }
    if (spec.size !== undefined) {
        clone.size = spec.size.slice(0);
    }
    if (spec.transform !== undefined) {
        clone.transform = spec.transform.slice(0);
    }
    if (spec.origin !== undefined) {
        clone.origin = spec.origin.slice(0);
    }
    if (spec.align !== undefined) {
        clone.align = spec.align.slice(0);
    }
    return clone;
};
function _isEqualArray(a, b) {
    if (a === b) {
        return true;
    }
    if (a === undefined || b === undefined) {
        return false;
    }
    var i = a.length;
    if (i !== b.length) {
        return false;
    }
    while (i--) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
LayoutUtility.isEqualSpec = function (spec1, spec2) {
    if (spec1.opacity !== spec2.opacity) {
        return false;
    }
    if (!_isEqualArray(spec1.size, spec2.size)) {
        return false;
    }
    if (!_isEqualArray(spec1.transform, spec2.transform)) {
        return false;
    }
    if (!_isEqualArray(spec1.origin, spec2.origin)) {
        return false;
    }
    if (!_isEqualArray(spec1.align, spec2.align)) {
        return false;
    }
    return true;
};
LayoutUtility.getSpecDiffText = function (spec1, spec2) {
    var result = 'spec diff:';
    if (spec1.opacity !== spec2.opacity) {
        result += '\nopacity: ' + spec1.opacity + ' != ' + spec2.opacity;
    }
    if (!_isEqualArray(spec1.size, spec2.size)) {
        result += '\nsize: ' + JSON.stringify(spec1.size) + ' != ' + JSON.stringify(spec2.size);
    }
    if (!_isEqualArray(spec1.transform, spec2.transform)) {
        result += '\ntransform: ' + JSON.stringify(spec1.transform) + ' != ' + JSON.stringify(spec2.transform);
    }
    if (!_isEqualArray(spec1.origin, spec2.origin)) {
        result += '\norigin: ' + JSON.stringify(spec1.origin) + ' != ' + JSON.stringify(spec2.origin);
    }
    if (!_isEqualArray(spec1.align, spec2.align)) {
        result += '\nalign: ' + JSON.stringify(spec1.align) + ' != ' + JSON.stringify(spec2.align);
    }
    return result;
};
LayoutUtility.error = function (message) {
    console.log('ERROR: ' + message);
    throw message;
};
LayoutUtility.warning = function (message) {
    console.log('WARNING: ' + message);
};
LayoutUtility.log = function (args) {
    var message = '';
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (arg instanceof Object || arg instanceof Array) {
            message += JSON.stringify(arg);
        } else {
            message += arg;
        }
    }
    console.log(message);
};
LayoutUtility.combineOptions = function (options1, options2, forceClone) {
    if (options1 && !options2 && !forceClone) {
        return options1;
    } else if (!options1 && options2 && !forceClone) {
        return options2;
    }
    var options = Utility.clone(options1 || {});
    if (options2) {
        for (var key in options2) {
            options[key] = options2[key];
        }
    }
    return options;
};
LayoutUtility.registerHelper = function (name, Helper) {
    if (!Helper.prototype.parse) {
        LayoutUtility.error('The layout-helper for name "' + name + '" is required to support the "parse" method');
    }
    if (this.registeredHelpers[name] !== undefined) {
        LayoutUtility.warning('A layout-helper with the name "' + name + '" is already registered and will be overwritten');
    }
    this.registeredHelpers[name] = Helper;
};
LayoutUtility.unregisterHelper = function (name) {
    delete this.registeredHelpers[name];
};
LayoutUtility.getRegisteredHelper = function (name) {
    return this.registeredHelpers[name];
};
module.exports = LayoutUtility;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],9:[function(require,module,exports){
(function (global){
var LayoutUtility = require('./LayoutUtility');
var LayoutController = require('./LayoutController');
var LayoutNode = require('./LayoutNode');
var FlowLayoutNode = require('./FlowLayoutNode');
var LayoutNodeManager = require('./LayoutNodeManager');
var ContainerSurface = typeof window !== 'undefined' ? window.famous.surfaces.ContainerSurface : typeof global !== 'undefined' ? global.famous.surfaces.ContainerSurface : null;
var Transform = typeof window !== 'undefined' ? window.famous.core.Transform : typeof global !== 'undefined' ? global.famous.core.Transform : null;
var EventHandler = typeof window !== 'undefined' ? window.famous.core.EventHandler : typeof global !== 'undefined' ? global.famous.core.EventHandler : null;
var Group = typeof window !== 'undefined' ? window.famous.core.Group : typeof global !== 'undefined' ? global.famous.core.Group : null;
var Vector = typeof window !== 'undefined' ? window.famous.math.Vector : typeof global !== 'undefined' ? global.famous.math.Vector : null;
var PhysicsEngine = typeof window !== 'undefined' ? window.famous.physics.PhysicsEngine : typeof global !== 'undefined' ? global.famous.physics.PhysicsEngine : null;
var Particle = typeof window !== 'undefined' ? window.famous.physics.bodies.Particle : typeof global !== 'undefined' ? global.famous.physics.bodies.Particle : null;
var Drag = typeof window !== 'undefined' ? window.famous.physics.forces.Drag : typeof global !== 'undefined' ? global.famous.physics.forces.Drag : null;
var Spring = typeof window !== 'undefined' ? window.famous.physics.forces.Spring : typeof global !== 'undefined' ? global.famous.physics.forces.Spring : null;
var ScrollSync = typeof window !== 'undefined' ? window.famous.inputs.ScrollSync : typeof global !== 'undefined' ? global.famous.inputs.ScrollSync : null;
var ViewSequence = typeof window !== 'undefined' ? window.famous.core.ViewSequence : typeof global !== 'undefined' ? global.famous.core.ViewSequence : null;
var Bounds = {
        NONE: 0,
        PREV: 1,
        NEXT: 2,
        BOTH: 3
    };
var SpringSource = {
        NONE: 'none',
        NEXTBOUNDS: 'next-bounds',
        PREVBOUNDS: 'prev-bounds',
        MINSIZE: 'minimal-size',
        GOTOSEQUENCE: 'goto-sequence',
        ENSUREVISIBLE: 'ensure-visible',
        GOTOPREVDIRECTION: 'goto-prev-direction',
        GOTONEXTDIRECTION: 'goto-next-direction',
        SNAPPREV: 'snap-prev',
        SNAPNEXT: 'snap-next'
    };
function ScrollController(options) {
    options = LayoutUtility.combineOptions(ScrollController.DEFAULT_OPTIONS, options);
    var layoutManager = new LayoutNodeManager(options.flow ? FlowLayoutNode : LayoutNode, _initLayoutNode.bind(this));
    LayoutController.call(this, options, layoutManager);
    this._scroll = {
        activeTouches: [],
        pe: new PhysicsEngine(),
        particle: new Particle(this.options.scrollParticle),
        dragForce: new Drag(this.options.scrollDrag),
        frictionForce: new Drag(this.options.scrollFriction),
        springValue: undefined,
        springForce: new Spring(this.options.scrollSpring),
        springEndState: new Vector([
            0,
            0,
            0
        ]),
        groupStart: 0,
        groupTranslate: [
            0,
            0,
            0
        ],
        scrollDelta: 0,
        normalizedScrollDelta: 0,
        scrollForce: 0,
        scrollForceCount: 0,
        unnormalizedScrollOffset: 0,
        isScrolling: false
    };
    this._debug = {
        layoutCount: 0,
        commitCount: 0
    };
    this.group = new Group();
    this.group.add({ render: _innerRender.bind(this) });
    this._scroll.pe.addBody(this._scroll.particle);
    if (!this.options.scrollDrag.disabled) {
        this._scroll.dragForceId = this._scroll.pe.attach(this._scroll.dragForce, this._scroll.particle);
    }
    if (!this.options.scrollFriction.disabled) {
        this._scroll.frictionForceId = this._scroll.pe.attach(this._scroll.frictionForce, this._scroll.particle);
    }
    this._scroll.springForce.setOptions({ anchor: this._scroll.springEndState });
    this._eventInput.on('touchstart', _touchStart.bind(this));
    this._eventInput.on('touchmove', _touchMove.bind(this));
    this._eventInput.on('touchend', _touchEnd.bind(this));
    this._eventInput.on('touchcancel', _touchEnd.bind(this));
    this._eventInput.on('mousedown', _mouseDown.bind(this));
    this._eventInput.on('mouseup', _mouseUp.bind(this));
    this._eventInput.on('mousemove', _mouseMove.bind(this));
    this._scrollSync = new ScrollSync(this.options.scrollSync);
    this._eventInput.pipe(this._scrollSync);
    this._scrollSync.on('update', _scrollUpdate.bind(this));
    if (this.options.useContainer) {
        this.container = new ContainerSurface(this.options.container);
        this.container.add({
            render: function () {
                return this.id;
            }.bind(this)
        });
        if (!this.options.autoPipeEvents) {
            this.subscribe(this.container);
            EventHandler.setInputHandler(this.container, this);
            EventHandler.setOutputHandler(this.container, this);
        }
    }
}
ScrollController.prototype = Object.create(LayoutController.prototype);
ScrollController.prototype.constructor = ScrollController;
ScrollController.Bounds = Bounds;
ScrollController.DEFAULT_OPTIONS = {
    flow: false,
    useContainer: false,
    container: { properties: { overflow: 'hidden' } },
    visibleItemThresshold: 0.5,
    scrollParticle: {},
    scrollDrag: {
        forceFunction: Drag.FORCE_FUNCTIONS.QUADRATIC,
        strength: 0.001,
        disabled: true
    },
    scrollFriction: {
        forceFunction: Drag.FORCE_FUNCTIONS.LINEAR,
        strength: 0.0025,
        disabled: false
    },
    scrollSpring: {
        dampingRatio: 1,
        period: 350
    },
    scrollSync: { scale: 0.2 },
    paginated: false,
    paginationEnergyThresshold: 0.005,
    alignment: 0,
    touchMoveDirectionThresshold: undefined,
    mouseMove: false,
    enabled: true,
    layoutAll: false,
    alwaysLayout: false,
    extraBoundsSpace: [
        100,
        100
    ],
    debug: false
};
ScrollController.prototype.setOptions = function (options) {
    LayoutController.prototype.setOptions.call(this, options);
    if (this._scroll) {
        if (options.scrollSpring) {
            this._scroll.springForce.setOptions(options.scrollSpring);
        }
        if (options.scrollDrag) {
            this._scroll.dragForce.setOptions(options.scrollDrag);
        }
    }
    if (options.scrollSync && this._scrollSync) {
        this._scrollSync.setOptions(options.scrollSync);
    }
    return this;
};
function _initLayoutNode(node, spec) {
    if (!spec && this.options.insertSpec) {
        node.setSpec(this.options.insertSpec);
    }
}
function _log(args) {
    if (!this.options.debug) {
        return;
    }
    var message = this._debug.commitCount + ': ';
    for (var i = 0, j = arguments.length; i < j; i++) {
        var arg = arguments[i];
        if (arg instanceof Object || arg instanceof Array) {
            message += JSON.stringify(arg);
        } else {
            message += arg;
        }
    }
    console.log(message);
}
function _updateSpring() {
    var springValue = this._scroll.scrollForceCount ? undefined : this._scroll.springPosition;
    if (this._scroll.springValue !== springValue) {
        this._scroll.springValue = springValue;
        if (springValue === undefined) {
            if (this._scroll.springForceId !== undefined) {
                this._scroll.pe.detach(this._scroll.springForceId);
                this._scroll.springForceId = undefined;
            }
        } else {
            if (this._scroll.springForceId === undefined) {
                this._scroll.springForceId = this._scroll.pe.attach(this._scroll.springForce, this._scroll.particle);
            }
            this._scroll.springEndState.set1D(springValue);
            this._scroll.pe.wake();
        }
    }
}
function _mouseDown(event) {
    if (!this.options.mouseMove) {
        return;
    }
    if (this._scroll.mouseMove) {
        this.releaseScrollForce(this._scroll.mouseMove.delta);
    }
    var current = [
            event.clientX,
            event.clientY
        ];
    var time = Date.now();
    this._scroll.mouseMove = {
        delta: 0,
        start: current,
        current: current,
        prev: current,
        time: time,
        prevTime: time
    };
    this.applyScrollForce(this._scroll.mouseMove.delta);
}
function _mouseMove(event) {
    if (!this._scroll.mouseMove || !this.options.enabled) {
        return;
    }
    var moveDirection = Math.atan2(Math.abs(event.clientY - this._scroll.mouseMove.prev[1]), Math.abs(event.clientX - this._scroll.mouseMove.prev[0])) / (Math.PI / 2);
    var directionDiff = Math.abs(this._direction - moveDirection);
    if (this.options.touchMoveDirectionThresshold === undefined || directionDiff <= this.options.touchMoveDirectionThresshold) {
        this._scroll.mouseMove.prev = this._scroll.mouseMove.current;
        this._scroll.mouseMove.current = [
            event.clientX,
            event.clientY
        ];
        this._scroll.mouseMove.prevTime = this._scroll.mouseMove.time;
        this._scroll.mouseMove.direction = moveDirection;
        this._scroll.mouseMove.time = Date.now();
    }
    var delta = this._scroll.mouseMove.current[this._direction] - this._scroll.mouseMove.start[this._direction];
    this.updateScrollForce(this._scroll.mouseMove.delta, delta);
    this._scroll.mouseMove.delta = delta;
}
function _mouseUp(event) {
    if (!this._scroll.mouseMove) {
        return;
    }
    var velocity = 0;
    var diffTime = this._scroll.mouseMove.time - this._scroll.mouseMove.prevTime;
    if (diffTime > 0) {
        var diffOffset = this._scroll.mouseMove.current[this._direction] - this._scroll.mouseMove.prev[this._direction];
        velocity = diffOffset / diffTime;
    }
    this.releaseScrollForce(this._scroll.mouseMove.delta, velocity);
    this._scroll.mouseMove = undefined;
}
function _touchStart(event) {
    if (!this._touchEndEventListener) {
        this._touchEndEventListener = function (event) {
            event.target.removeEventListener('touchend', this._touchEndEventListener);
            _touchEnd.call(this, event);
        }.bind(this);
    }
    var oldTouchesCount = this._scroll.activeTouches.length;
    var i = 0;
    var j;
    var touchFound;
    while (i < this._scroll.activeTouches.length) {
        var activeTouch = this._scroll.activeTouches[i];
        touchFound = false;
        for (j = 0; j < event.touches.length; j++) {
            var touch = event.touches[j];
            if (touch.identifier === activeTouch.id) {
                touchFound = true;
                break;
            }
        }
        if (!touchFound) {
            this._scroll.activeTouches.splice(i, 1);
        } else {
            i++;
        }
    }
    for (i = 0; i < event.touches.length; i++) {
        var changedTouch = event.touches[i];
        touchFound = false;
        for (j = 0; j < this._scroll.activeTouches.length; j++) {
            if (this._scroll.activeTouches[j].id === changedTouch.identifier) {
                touchFound = true;
                break;
            }
        }
        if (!touchFound) {
            var current = [
                    changedTouch.clientX,
                    changedTouch.clientY
                ];
            var time = Date.now();
            this._scroll.activeTouches.push({
                id: changedTouch.identifier,
                start: current,
                current: current,
                prev: current,
                time: time,
                prevTime: time
            });
            changedTouch.target.addEventListener('touchend', this._touchEndEventListener);
        }
    }
    if (!oldTouchesCount && this._scroll.activeTouches.length) {
        this.applyScrollForce(0);
        this._scroll.touchDelta = 0;
    }
}
function _touchMove(event) {
    if (!this.options.enabled) {
        return;
    }
    var primaryTouch;
    for (var i = 0; i < event.changedTouches.length; i++) {
        var changedTouch = event.changedTouches[i];
        for (var j = 0; j < this._scroll.activeTouches.length; j++) {
            var touch = this._scroll.activeTouches[j];
            if (touch.id === changedTouch.identifier) {
                var moveDirection = Math.atan2(Math.abs(changedTouch.clientY - touch.prev[1]), Math.abs(changedTouch.clientX - touch.prev[0])) / (Math.PI / 2);
                var directionDiff = Math.abs(this._direction - moveDirection);
                if (this.options.touchMoveDirectionThresshold === undefined || directionDiff <= this.options.touchMoveDirectionThresshold) {
                    touch.prev = touch.current;
                    touch.current = [
                        changedTouch.clientX,
                        changedTouch.clientY
                    ];
                    touch.prevTime = touch.time;
                    touch.direction = moveDirection;
                    touch.time = Date.now();
                    primaryTouch = j === 0 ? touch : undefined;
                }
            }
        }
    }
    if (primaryTouch) {
        var delta = primaryTouch.current[this._direction] - primaryTouch.start[this._direction];
        this.updateScrollForce(this._scroll.touchDelta, delta);
        this._scroll.touchDelta = delta;
    }
}
function _touchEnd(event) {
    var primaryTouch = this._scroll.activeTouches.length ? this._scroll.activeTouches[0] : undefined;
    for (var i = 0; i < event.changedTouches.length; i++) {
        var changedTouch = event.changedTouches[i];
        for (var j = 0; j < this._scroll.activeTouches.length; j++) {
            var touch = this._scroll.activeTouches[j];
            if (touch.id === changedTouch.identifier) {
                this._scroll.activeTouches.splice(j, 1);
                if (j === 0 && this._scroll.activeTouches.length) {
                    var newPrimaryTouch = this._scroll.activeTouches[0];
                    newPrimaryTouch.start[0] = newPrimaryTouch.current[0] - (touch.current[0] - touch.start[0]);
                    newPrimaryTouch.start[1] = newPrimaryTouch.current[1] - (touch.current[1] - touch.start[1]);
                }
                break;
            }
        }
    }
    if (!primaryTouch || this._scroll.activeTouches.length) {
        return;
    }
    var velocity = 0;
    var diffTime = primaryTouch.time - primaryTouch.prevTime;
    if (diffTime > 0) {
        var diffOffset = primaryTouch.current[this._direction] - primaryTouch.prev[this._direction];
        velocity = diffOffset / diffTime;
    }
    var delta = this._scroll.touchDelta;
    this.releaseScrollForce(delta, velocity);
    this._scroll.touchDelta = 0;
}
function _scrollUpdate(event) {
    if (!this.options.enabled) {
        return;
    }
    var offset = Array.isArray(event.delta) ? event.delta[this._direction] : event.delta;
    this.scroll(offset);
}
function _setParticle(position, velocity, phase) {
    if (position !== undefined) {
        this._scroll.particleValue = position;
        this._scroll.particle.setPosition1D(position);
    }
    if (velocity !== undefined) {
        var oldVelocity = this._scroll.particle.getVelocity1D();
        if (oldVelocity !== velocity) {
            this._scroll.particle.setVelocity1D(velocity);
        }
    }
}
function _calcScrollOffset(normalize, refreshParticle) {
    if (refreshParticle || this._scroll.particleValue === undefined) {
        this._scroll.particleValue = this._scroll.particle.getPosition1D();
        this._scroll.particleValue = Math.round(this._scroll.particleValue * 1000) / 1000;
    }
    var scrollOffset = this._scroll.particleValue;
    if (this._scroll.scrollDelta || this._scroll.normalizedScrollDelta) {
        scrollOffset += this._scroll.scrollDelta + this._scroll.normalizedScrollDelta;
        if (this._scroll.boundsReached & Bounds.PREV && scrollOffset > this._scroll.springPosition || this._scroll.boundsReached & Bounds.NEXT && scrollOffset < this._scroll.springPosition || this._scroll.boundsReached === Bounds.BOTH) {
            scrollOffset = this._scroll.springPosition;
        }
        if (normalize) {
            if (!this._scroll.scrollDelta) {
                this._scroll.normalizedScrollDelta = 0;
                _setParticle.call(this, scrollOffset, undefined, '_calcScrollOffset');
            }
            this._scroll.normalizedScrollDelta += this._scroll.scrollDelta;
            this._scroll.scrollDelta = 0;
        }
    }
    if (this._scroll.scrollForceCount && this._scroll.scrollForce) {
        if (this._scroll.springPosition !== undefined) {
            scrollOffset = (scrollOffset + this._scroll.scrollForce + this._scroll.springPosition) / 2;
        } else {
            scrollOffset += this._scroll.scrollForce;
        }
    }
    return scrollOffset;
}
ScrollController.prototype._calcScrollHeight = function (next) {
    var calcedHeight = 0;
    var node = this._nodes.getStartEnumNode(next);
    while (node) {
        if (node._invalidated) {
            if (node.trueSizeRequested) {
                calcedHeight = undefined;
                break;
            }
            if (node.scrollLength !== undefined) {
                calcedHeight += node.scrollLength;
            }
        }
        node = next ? node._next : node._prev;
    }
    return calcedHeight;
};
function _calcBounds(size, scrollOffset) {
    var prevHeight = this._calcScrollHeight(false);
    var nextHeight = this._calcScrollHeight(true);
    if (prevHeight === undefined || nextHeight === undefined) {
        this._scroll.boundsReached = Bounds.NONE;
        this._scroll.springPosition = undefined;
        this._scroll.springSource = SpringSource.NONE;
        return;
    }
    var totalHeight;
    if (nextHeight !== undefined && prevHeight !== undefined) {
        totalHeight = prevHeight + nextHeight;
    }
    if (totalHeight !== undefined && totalHeight <= size[this._direction]) {
        this._scroll.boundsReached = Bounds.BOTH;
        this._scroll.springPosition = this.options.alignment ? -nextHeight : prevHeight;
        this._scroll.springSource = SpringSource.MINSIZE;
        return;
    }
    if (this.options.alignment) {
        if (nextHeight !== undefined && scrollOffset + nextHeight <= 0) {
            this._scroll.boundsReached = Bounds.NEXT;
            this._scroll.springPosition = -nextHeight;
            this._scroll.springSource = SpringSource.NEXTBOUNDS;
            return;
        }
    } else {
        if (prevHeight !== undefined && scrollOffset - prevHeight >= 0) {
            this._scroll.boundsReached = Bounds.PREV;
            this._scroll.springPosition = prevHeight;
            this._scroll.springSource = SpringSource.PREVBOUNDS;
            return;
        }
    }
    if (this.options.alignment) {
        if (prevHeight !== undefined && scrollOffset - prevHeight >= -size[this._direction]) {
            this._scroll.boundsReached = Bounds.PREV;
            this._scroll.springPosition = -size[this._direction] + prevHeight;
            this._scroll.springSource = SpringSource.PREVBOUNDS;
            return;
        }
    } else {
        if (nextHeight !== undefined && scrollOffset + nextHeight <= size[this._direction]) {
            this._scroll.boundsReached = Bounds.NEXT;
            this._scroll.springPosition = size[this._direction] - nextHeight;
            this._scroll.springSource = SpringSource.NEXTBOUNDS;
            return;
        }
    }
    this._scroll.boundsReached = Bounds.NONE;
    this._scroll.springPosition = undefined;
    this._scroll.springSource = SpringSource.NONE;
}
function _calcScrollToOffset(size, scrollOffset) {
    var scrollToRenderNode = this._scroll.scrollToRenderNode || this._scroll.ensureVisibleRenderNode;
    if (!scrollToRenderNode) {
        return;
    }
    if (this._scroll.boundsReached === Bounds.BOTH || !this._scroll.scrollToDirection && this._scroll.boundsReached === Bounds.PREV || this._scroll.scrollToDirection && this._scroll.boundsReached === Bounds.NEXT) {
        return;
    }
    var foundNode;
    var scrollToOffset = 0;
    var node = this._nodes.getStartEnumNode(true);
    var count = 0;
    while (node) {
        count++;
        if (!node._invalidated || node.scrollLength === undefined) {
            break;
        }
        if (this.options.alignment) {
            scrollToOffset -= node.scrollLength;
        }
        if (node.renderNode === scrollToRenderNode) {
            foundNode = node;
            break;
        }
        if (!this.options.alignment) {
            scrollToOffset -= node.scrollLength;
        }
        node = node._next;
    }
    if (!foundNode) {
        scrollToOffset = 0;
        node = this._nodes.getStartEnumNode(false);
        while (node) {
            if (!node._invalidated || node.scrollLength === undefined) {
                break;
            }
            if (!this.options.alignment) {
                scrollToOffset += node.scrollLength;
            }
            if (node.renderNode === scrollToRenderNode) {
                foundNode = node;
                break;
            }
            if (this.options.alignment) {
                scrollToOffset += node.scrollLength;
            }
            node = node._prev;
        }
    }
    if (foundNode) {
        if (this._scroll.ensureVisibleSequence) {
            if (this.options.alignment) {
                if (scrollToOffset - foundNode.scrollLength < 0) {
                    this._scroll.springPosition = scrollToOffset;
                    this._scroll.springSource = SpringSource.ENSUREVISIBLE;
                } else if (scrollToOffset > size[this._direction]) {
                    this._scroll.springPosition = size[this._direction] - scrollToOffset;
                    this._scroll.springSource = SpringSource.ENSUREVISIBLE;
                } else {
                    this._scroll.ensureVisibleRenderNode = undefined;
                }
            } else {
                scrollToOffset = -scrollToOffset;
                if (scrollToOffset < 0) {
                    this._scroll.springPosition = scrollToOffset;
                    this._scroll.springSource = SpringSource.ENSUREVISIBLE;
                } else if (scrollToOffset + foundNode.scrollLength > size[this._direction]) {
                    this._scroll.springPosition = size[this._direction] - (scrollToOffset + foundNode.scrollLength);
                    this._scroll.springSource = SpringSource.ENSUREVISIBLE;
                } else {
                    this._scroll.ensureVisibleRenderNode = undefined;
                }
            }
        } else {
            this._scroll.springPosition = scrollToOffset;
            this._scroll.springSource = SpringSource.GOTOSEQUENCE;
        }
        return;
    }
    if (this._scroll.scrollToDirection) {
        this._scroll.springPosition = scrollOffset - size[this._direction];
        this._scroll.springSource = SpringSource.GOTOPREVDIRECTION;
    } else {
        this._scroll.springPosition = scrollOffset + size[this._direction];
        this._scroll.springSource = SpringSource.GOTONEXTDIRECTION;
    }
}
function _snapToPage(size, scrollOffset) {
    if (!this.options.paginated || this._scroll.scrollForceCount || this._scroll.springPosition !== undefined) {
        return;
    }
    var pageOffset = scrollOffset;
    var pageLength;
    var hasNext;
    var node = this._nodes.getStartEnumNode(false);
    while (node) {
        if (!node._invalidated) {
            break;
        }
        if (node.scrollLength !== 0) {
            if (pageOffset <= 0 || node.scrollLength === undefined) {
                break;
            }
            hasNext = pageLength !== undefined;
            pageLength = node.scrollLength;
            pageOffset -= node.scrollLength;
        }
        node = node._prev;
    }
    if (pageLength === undefined) {
        node = this._nodes.getStartEnumNode(true);
        while (node) {
            if (!node._invalidated) {
                break;
            }
            if (node.scrollLength !== 0) {
                if (node.scrollLength === undefined) {
                    break;
                }
                hasNext = pageLength !== undefined;
                if (hasNext) {
                    if (pageOffset + pageLength > 0) {
                        break;
                    }
                    pageOffset += pageLength;
                }
                pageLength = node.scrollLength;
            }
            node = node._next;
        }
    }
    if (!pageLength) {
        return;
    }
    var flipToPrev;
    var flipToNext;
    if (this.options.paginationEnergyThresshold && Math.abs(this._scroll.particle.getEnergy()) >= this.options.paginationEnergyThresshold) {
        var velocity = this._scroll.particle.getVelocity1D();
        flipToPrev = velocity > 0;
        flipToNext = velocity < 0;
    }
    var boundOffset = pageOffset;
    var snapSpringPosition;
    if (!hasNext || flipToPrev || !flipToNext && Math.abs(boundOffset) < Math.abs(boundOffset + pageLength)) {
        snapSpringPosition = scrollOffset - pageOffset - (this.options.alignment ? pageLength : 0);
        if (snapSpringPosition !== this._scroll.springPosition) {
            this._scroll.springPosition = snapSpringPosition;
            this._scroll.springSource = SpringSource.SNAPPREV;
        }
    } else {
        snapSpringPosition = scrollOffset - (pageOffset + pageLength);
        if (snapSpringPosition !== this._scroll.springPosition) {
            this._scroll.springPosition = snapSpringPosition;
            this._scroll.springSource = SpringSource.SNAPNEXT;
        }
    }
}
function _normalizePrevViewSequence(size, scrollOffset) {
    var count = 0;
    var normalizedScrollOffset = scrollOffset;
    var normalizeNextPrev = false;
    var node = this._nodes.getStartEnumNode(false);
    while (node) {
        if (!node._invalidated || !node._viewSequence) {
            break;
        }
        if (normalizeNextPrev) {
            this._viewSequence = node._viewSequence;
            normalizedScrollOffset = scrollOffset;
            normalizeNextPrev = false;
        }
        if (node.scrollLength === undefined || node.trueSizeRequested || scrollOffset < 0) {
            break;
        }
        scrollOffset -= node.scrollLength;
        count++;
        if (node.scrollLength) {
            if (this.options.alignment) {
                normalizeNextPrev = scrollOffset >= 0;
            } else {
                this._viewSequence = node._viewSequence;
                normalizedScrollOffset = scrollOffset;
            }
        }
        node = node._prev;
    }
    return normalizedScrollOffset;
}
function _normalizeNextViewSequence(size, scrollOffset) {
    var count = 0;
    var normalizedScrollOffset = scrollOffset;
    var node = this._nodes.getStartEnumNode(true);
    while (node) {
        if (!node._invalidated || node.scrollLength === undefined || node.trueSizeRequested || !node._viewSequence || scrollOffset > 0 && (!this.options.alignment || node.scrollLength !== 0)) {
            break;
        }
        if (this.options.alignment) {
            scrollOffset += node.scrollLength;
            count++;
        }
        if (node.scrollLength || this.options.alignment) {
            this._viewSequence = node._viewSequence;
            normalizedScrollOffset = scrollOffset;
        }
        if (!this.options.alignment) {
            scrollOffset += node.scrollLength;
            count++;
        }
        node = node._next;
    }
    return normalizedScrollOffset;
}
function _normalizeViewSequence(size, scrollOffset) {
    var caps = this._layout.capabilities;
    if (caps && caps.debug && caps.debug.normalize !== undefined && !caps.debug.normalize) {
        return scrollOffset;
    }
    if (this._scroll.scrollForceCount) {
        return scrollOffset;
    }
    var normalizedScrollOffset = scrollOffset;
    if (this.options.alignment && scrollOffset < 0) {
        normalizedScrollOffset = _normalizeNextViewSequence.call(this, size, scrollOffset);
    } else if (!this.options.alignment && scrollOffset > 0) {
        normalizedScrollOffset = _normalizePrevViewSequence.call(this, size, scrollOffset);
    }
    if (normalizedScrollOffset === scrollOffset) {
        if (this.options.alignment && scrollOffset > 0) {
            normalizedScrollOffset = _normalizePrevViewSequence.call(this, size, scrollOffset);
        } else if (!this.options.alignment && scrollOffset < 0) {
            normalizedScrollOffset = _normalizeNextViewSequence.call(this, size, scrollOffset);
        }
    }
    if (normalizedScrollOffset !== scrollOffset) {
        var delta = normalizedScrollOffset - scrollOffset;
        var particleValue = this._scroll.particle.getPosition1D();
        _setParticle.call(this, particleValue + delta, undefined, 'normalize');
        if (this._scroll.springPosition !== undefined) {
            this._scroll.springPosition += delta;
        }
        if (caps && caps.sequentialScrollingOptimized) {
            this._scroll.groupStart -= delta;
        }
    }
    return normalizedScrollOffset;
}
ScrollController.prototype.getVisibleItems = function () {
    var size = this._contextSizeCache;
    var scrollOffset = this.options.alignment ? this._scroll.unnormalizedScrollOffset + size[this._direction] : this._scroll.unnormalizedScrollOffset;
    var result = [];
    var node = this._nodes.getStartEnumNode(true);
    while (node) {
        if (!node._invalidated || node.scrollLength === undefined || scrollOffset > size[this._direction]) {
            break;
        }
        scrollOffset += node.scrollLength;
        if (scrollOffset >= 0 && node._viewSequence) {
            result.push({
                index: node._viewSequence.getIndex(),
                viewSequence: node._viewSequence,
                renderNode: node.renderNode,
                visiblePerc: node.scrollLength ? (Math.min(scrollOffset, size[this._direction]) - Math.max(scrollOffset - node.scrollLength, 0)) / node.scrollLength : 1,
                scrollOffset: scrollOffset - node.scrollLength,
                scrollLength: node.scrollLength
            });
        }
        node = node._next;
    }
    scrollOffset = this.options.alignment ? this._scroll.unnormalizedScrollOffset + size[this._direction] : this._scroll.unnormalizedScrollOffset;
    node = this._nodes.getStartEnumNode(false);
    while (node) {
        if (!node._invalidated || node.scrollLength === undefined || scrollOffset < 0) {
            break;
        }
        scrollOffset -= node.scrollLength;
        if (scrollOffset < size[this._direction] && node._viewSequence) {
            result.unshift({
                index: node._viewSequence.getIndex(),
                viewSequence: node._viewSequence,
                renderNode: node.renderNode,
                visiblePerc: node.scrollLength ? (Math.min(scrollOffset + node.scrollLength, size[this._direction]) - Math.max(scrollOffset, 0)) / node.scrollLength : 1,
                scrollOffset: scrollOffset,
                scrollLength: node.scrollLength
            });
        }
        node = node._prev;
    }
    return result;
};
ScrollController.prototype.getFirstVisibleItem = function () {
    var size = this._contextSizeCache;
    var scrollOffset = this.options.alignment ? this._scroll.unnormalizedScrollOffset + size[this._direction] : this._scroll.unnormalizedScrollOffset;
    var node = this._nodes.getStartEnumNode(true);
    var nodeFoundVisiblePerc;
    var nodeFoundScrollOffset;
    var nodeFound;
    while (node) {
        if (!node._invalidated || node.scrollLength === undefined || scrollOffset > size[this._direction]) {
            break;
        }
        scrollOffset += node.scrollLength;
        if (scrollOffset >= 0 && node._viewSequence) {
            nodeFoundVisiblePerc = node.scrollLength ? (Math.min(scrollOffset, size[this._direction]) - Math.max(scrollOffset - node.scrollLength, 0)) / node.scrollLength : 1;
            nodeFoundScrollOffset = scrollOffset - node.scrollLength;
            if (nodeFoundVisiblePerc >= this.options.visibleItemThresshold || nodeFoundScrollOffset >= 0) {
                nodeFound = node;
                break;
            }
        }
        node = node._next;
    }
    scrollOffset = this.options.alignment ? this._scroll.unnormalizedScrollOffset + size[this._direction] : this._scroll.unnormalizedScrollOffset;
    node = this._nodes.getStartEnumNode(false);
    while (node) {
        if (!node._invalidated || node.scrollLength === undefined || scrollOffset < 0) {
            break;
        }
        scrollOffset -= node.scrollLength;
        if (scrollOffset < size[this._direction] && node._viewSequence) {
            var visiblePerc = node.scrollLength ? (Math.min(scrollOffset + node.scrollLength, size[this._direction]) - Math.max(scrollOffset, 0)) / node.scrollLength : 1;
            if (visiblePerc >= this.options.visibleItemThresshold || scrollOffset >= 0) {
                nodeFoundVisiblePerc = visiblePerc;
                nodeFoundScrollOffset = scrollOffset;
                nodeFound = node;
                break;
            }
        }
        node = node._prev;
    }
    return nodeFound ? {
        index: nodeFound._viewSequence.getIndex(),
        viewSequence: nodeFound._viewSequence,
        renderNode: nodeFound.renderNode,
        visiblePerc: nodeFoundVisiblePerc,
        scrollOffset: nodeFoundScrollOffset,
        scrollLength: nodeFound.scrollLength
    } : undefined;
};
ScrollController.prototype.getLastVisibleItem = function () {
    var items = this.getVisibleItems();
    var size = this._contextSizeCache;
    for (var i = items.length - 1; i >= 0; i--) {
        var item = items[i];
        if (item.visiblePerc >= this.options.visibleItemThresshold || item.scrollOffset + item.scrollLength <= size[this._direction]) {
            return item;
        }
    }
    return items.length ? items[items.length - 1] : undefined;
};
function _scrollToSequence(viewSequence, next) {
    this._scroll.scrollToSequence = viewSequence;
    this._scroll.scrollToRenderNode = viewSequence.get();
    this._scroll.ensureVisibleRenderNode = undefined;
    this._scroll.scrollToDirection = next;
    this._scroll.scrollDirty = true;
}
function _ensureVisibleSequence(viewSequence, next) {
    this._scroll.scrollToSequence = undefined;
    this._scroll.scrollToRenderNode = undefined;
    this._scroll.ensureVisibleRenderNode = viewSequence.get();
    this._scroll.scrollToDirection = next;
    this._scroll.scrollDirty = true;
}
function _goToPage(amount) {
    var viewSequence = this._scroll.scrollToSequence || this._viewSequence;
    if (!this._scroll.scrollToSequence) {
        var firstVisibleItem = this.getFirstVisibleItem();
        if (firstVisibleItem) {
            viewSequence = firstVisibleItem.viewSequence;
            if (amount < 0 && firstVisibleItem.scrollOffset < 0 || amount > 0 && firstVisibleItem.scrollOffset > 0) {
                amount = 0;
            }
        }
    }
    if (!viewSequence) {
        return;
    }
    for (var i = 0; i < Math.abs(amount); i++) {
        var nextViewSequence = amount > 0 ? viewSequence.getNext() : viewSequence.getPrevious();
        if (nextViewSequence) {
            viewSequence = nextViewSequence;
        } else {
            break;
        }
    }
    _scrollToSequence.call(this, viewSequence, amount >= 0);
}
ScrollController.prototype.goToFirstPage = function () {
    if (!this._viewSequence) {
        return this;
    }
    if (this._viewSequence._ && this._viewSequence._.loop) {
        LayoutUtility.error('Unable to go to first item of looped ViewSequence');
        return this;
    }
    var viewSequence = this._viewSequence;
    while (viewSequence) {
        var prev = viewSequence.getPrevious();
        if (prev && prev.get()) {
            viewSequence = prev;
        } else {
            break;
        }
    }
    _scrollToSequence.call(this, viewSequence, false);
    return this;
};
ScrollController.prototype.goToPreviousPage = function () {
    _goToPage.call(this, -1);
    return this;
};
ScrollController.prototype.goToNextPage = function () {
    _goToPage.call(this, 1);
    return this;
};
ScrollController.prototype.goToLastPage = function () {
    if (!this._viewSequence) {
        return this;
    }
    if (this._viewSequence._ && this._viewSequence._.loop) {
        LayoutUtility.error('Unable to go to last item of looped ViewSequence');
        return this;
    }
    var viewSequence = this._viewSequence;
    while (viewSequence) {
        var next = viewSequence.getNext();
        if (next && next.get()) {
            viewSequence = next;
        } else {
            break;
        }
    }
    _scrollToSequence.call(this, viewSequence, true);
    return this;
};
ScrollController.prototype.goToRenderNode = function (node) {
    if (!this._viewSequence || !node) {
        return this;
    }
    if (this._viewSequence.get() === node) {
        var next = _calcScrollOffset.call(this) >= 0;
        _scrollToSequence.call(this, this._viewSequence, next);
        return this;
    }
    var nextSequence = this._viewSequence.getNext();
    var prevSequence = this._viewSequence.getPrevious();
    while ((nextSequence || prevSequence) && nextSequence !== this._viewSequence) {
        var nextNode = nextSequence ? nextSequence.get() : undefined;
        if (nextNode === node) {
            _scrollToSequence.call(this, nextSequence, true);
            break;
        }
        var prevNode = prevSequence ? prevSequence.get() : undefined;
        if (prevNode === node) {
            _scrollToSequence.call(this, prevSequence, false);
            break;
        }
        nextSequence = nextNode ? nextSequence.getNext() : undefined;
        prevSequence = prevNode ? prevSequence.getPrevious() : undefined;
    }
    return this;
};
ScrollController.prototype.ensureVisible = function (node) {
    if (node instanceof ViewSequence) {
        node = node.get();
    } else if (node instanceof Number || typeof node === 'number') {
        var viewSequence = this._viewSequence;
        while (viewSequence.getIndex() < node) {
            viewSequence = viewSequence.getNext();
            if (!viewSequence) {
                return this;
            }
        }
        while (viewSequence.getIndex() > node) {
            viewSequence = viewSequence.getPrevious();
            if (!viewSequence) {
                return this;
            }
        }
    }
    if (this._viewSequence.get() === node) {
        var next = _calcScrollOffset.call(this) >= 0;
        _ensureVisibleSequence.call(this, this._viewSequence, next);
        return this;
    }
    var nextSequence = this._viewSequence.getNext();
    var prevSequence = this._viewSequence.getPrevious();
    while ((nextSequence || prevSequence) && nextSequence !== this._viewSequence) {
        var nextNode = nextSequence ? nextSequence.get() : undefined;
        if (nextNode === node) {
            _ensureVisibleSequence.call(this, nextSequence, true);
            break;
        }
        var prevNode = prevSequence ? prevSequence.get() : undefined;
        if (prevNode === node) {
            _ensureVisibleSequence.call(this, prevSequence, false);
            break;
        }
        nextSequence = nextNode ? nextSequence.getNext() : undefined;
        prevSequence = prevNode ? prevSequence.getPrevious() : undefined;
    }
    return this;
};
ScrollController.prototype.scroll = function (delta) {
    this.halt();
    this._scroll.scrollDelta += delta;
    return this;
};
ScrollController.prototype.canScroll = function (delta) {
    var scrollOffset = _calcScrollOffset.call(this);
    var prevHeight = this._calcScrollHeight(false);
    var nextHeight = this._calcScrollHeight(true);
    var totalHeight;
    if (nextHeight !== undefined && prevHeight !== undefined) {
        totalHeight = prevHeight + nextHeight;
    }
    if (totalHeight !== undefined && totalHeight <= this._contextSizeCache[this._direction]) {
        return 0;
    }
    if (delta < 0 && nextHeight !== undefined) {
        var nextOffset = this._contextSizeCache[this._direction] - (scrollOffset + nextHeight);
        return Math.max(nextOffset, delta);
    } else if (delta > 0 && prevHeight !== undefined) {
        var prevOffset = -(scrollOffset - prevHeight);
        return Math.min(prevOffset, delta);
    }
    return delta;
};
ScrollController.prototype.halt = function () {
    this._scroll.scrollToSequence = undefined;
    this._scroll.scrollToRenderNode = undefined;
    this._scroll.ensureVisibleRenderNode = undefined;
    _setParticle.call(this, undefined, 0, 'halt');
    return this;
};
ScrollController.prototype.isScrolling = function () {
    return this._scroll.isScrolling;
};
ScrollController.prototype.getBoundsReached = function () {
    return this._scroll.boundsReached;
};
ScrollController.prototype.getVelocity = function () {
    return this._scroll.particle.getVelocity1D();
};
ScrollController.prototype.setVelocity = function (velocity) {
    return this._scroll.particle.setVelocity1D(velocity);
};
ScrollController.prototype.applyScrollForce = function (delta) {
    this.halt();
    this._scroll.scrollForceCount++;
    this._scroll.scrollForce += delta;
    return this;
};
ScrollController.prototype.updateScrollForce = function (prevDelta, newDelta) {
    this.halt();
    newDelta -= prevDelta;
    this._scroll.scrollForce += newDelta;
    return this;
};
ScrollController.prototype.releaseScrollForce = function (delta, velocity) {
    this.halt();
    if (this._scroll.scrollForceCount === 1) {
        var scrollOffset = _calcScrollOffset.call(this);
        _setParticle.call(this, scrollOffset, velocity, 'releaseScrollForce');
        this._scroll.pe.wake();
        this._scroll.scrollForce = 0;
        this._scroll.scrollDirty = true;
    } else {
        this._scroll.scrollForce -= delta;
    }
    this._scroll.scrollForceCount--;
    return this;
};
ScrollController.prototype.getSpec = function (node) {
    var spec = LayoutController.prototype.getSpec.call(this, node);
    if (spec && this._layout.capabilities && this._layout.capabilities.sequentialScrollingOptimized) {
        spec = {
            origin: spec.origin,
            align: spec.align,
            opacity: spec.opacity,
            size: spec.size,
            renderNode: spec.renderNode,
            transform: spec.transform
        };
        var translate = [
                0,
                0,
                0
            ];
        translate[this._direction] = this._scrollOffsetCache + this._scroll.groupStart;
        spec.transform = Transform.thenMove(spec.transform, translate);
    }
    return spec;
};
function _layout(size, scrollOffset, nested) {
    this._debug.layoutCount++;
    var scrollStart = 0 - Math.max(this.options.extraBoundsSpace[0], 1);
    var scrollEnd = size[this._direction] + Math.max(this.options.extraBoundsSpace[1], 1);
    if (this.options.layoutAll) {
        scrollStart = -1000000;
        scrollEnd = 1000000;
    }
    var layoutContext = this._nodes.prepareForLayout(this._viewSequence, this._nodesById, {
            size: size,
            direction: this._direction,
            reverse: this.options.alignment ? true : false,
            scrollOffset: this.options.alignment ? scrollOffset + size[this._direction] : scrollOffset,
            scrollStart: scrollStart,
            scrollEnd: scrollEnd
        });
    if (this._layout._function) {
        this._layout._function(layoutContext, this._layout.options);
    }
    if (this._postLayout) {
        this._postLayout(size, scrollOffset);
    }
    this._nodes.removeNonInvalidatedNodes(this.options.removeSpec);
    _calcBounds.call(this, size, scrollOffset);
    _calcScrollToOffset.call(this, size, scrollOffset);
    _snapToPage.call(this, size, scrollOffset);
    var newScrollOffset = _calcScrollOffset.call(this, true);
    if (!nested && newScrollOffset !== scrollOffset) {
        return _layout.call(this, size, newScrollOffset, true);
    }
    this._scroll.unnormalizedScrollOffset = scrollOffset;
    scrollOffset = _normalizeViewSequence.call(this, size, scrollOffset);
    _updateSpring.call(this);
    return scrollOffset;
}
function _innerRender() {
    var specs = this._specs;
    for (var i3 = 0, j3 = specs.length; i3 < j3; i3++) {
        specs[i3].target = specs[i3].renderNode.render();
    }
    return specs;
}
ScrollController.prototype.commit = function commit(context) {
    var size = context.size;
    this._debug.commitCount++;
    var scrollOffset = _calcScrollOffset.call(this, true, true);
    if (this._scrollOffsetCache === undefined) {
        this._scrollOffsetCache = scrollOffset;
    }
    var emitEndScrollingEvent = false;
    var emitScrollEvent = false;
    var eventData;
    if (size[0] !== this._contextSizeCache[0] || size[1] !== this._contextSizeCache[1] || this._isDirty || this._scroll.scrollDirty || this._nodes._trueSizeRequested || this.options.alwaysLayout || this._scrollOffsetCache !== scrollOffset) {
        eventData = {
            target: this,
            oldSize: this._contextSizeCache,
            size: size,
            oldScrollOffset: this._scrollOffsetCache,
            scrollOffset: scrollOffset
        };
        if (this._scrollOffsetCache !== scrollOffset) {
            if (!this._scroll.isScrolling) {
                this._scroll.isScrolling = true;
                this._eventOutput.emit('scrollstart', eventData);
            }
            emitScrollEvent = true;
        }
        this._eventOutput.emit('layoutstart', eventData);
        if (this.options.flow && (this._isDirty || this.options.reflowOnResize && (size[0] !== this._contextSizeCache[0] || size[1] !== this._contextSizeCache[1]))) {
            var node = this._nodes.getStartEnumNode();
            while (node) {
                node.releaseLock();
                node = node._next;
            }
        }
        this._contextSizeCache[0] = size[0];
        this._contextSizeCache[1] = size[1];
        this._isDirty = false;
        this._scroll.scrollDirty = false;
        scrollOffset = _layout.call(this, size, scrollOffset);
        this._scrollOffsetCache = scrollOffset;
        eventData.scrollOffset = this._scrollOffsetCache;
        this._eventOutput.emit('layoutend', eventData);
    } else if (this._scroll.isScrolling && !this._scroll.scrollForceCount) {
        emitEndScrollingEvent = true;
    }
    var groupTranslate = this._scroll.groupTranslate;
    groupTranslate[0] = 0;
    groupTranslate[1] = 0;
    groupTranslate[2] = 0;
    groupTranslate[this._direction] = -this._scroll.groupStart - scrollOffset;
    var sequentialScrollingOptimized = this._layout.capabilities ? this._layout.capabilities.sequentialScrollingOptimized : false;
    var result = this._nodes.buildSpecAndDestroyUnrenderedNodes(sequentialScrollingOptimized ? groupTranslate : undefined);
    this._specs = result.specs;
    if (result.modified) {
        this._eventOutput.emit('reflow', { target: this });
    }
    if (emitScrollEvent) {
        this._eventOutput.emit('scroll', eventData);
    }
    if (eventData) {
        var visibleItem = this.options.alignment ? this.getLastVisibleItem() : this.getFirstVisibleItem();
        if (visibleItem && !this._visibleItemCache || !visibleItem && this._visibleItemCache || visibleItem && this._visibleItemCache && visibleItem.renderNode !== this._visibleItemCache.renderNode) {
            this._eventOutput.emit('pagechange', {
                target: this,
                oldViewSequence: this._visibleItemCache ? this._visibleItemCache.viewSequence : undefined,
                viewSequence: visibleItem ? visibleItem.viewSequence : undefined,
                oldIndex: this._visibleItemCache ? this._visibleItemCache.index : undefined,
                index: visibleItem ? visibleItem.index : undefined
            });
            this._visibleItemCache = visibleItem;
        }
    }
    if (emitEndScrollingEvent) {
        this._scroll.isScrolling = false;
        eventData = {
            target: this,
            oldSize: size,
            size: size,
            oldScrollOffset: scrollOffset,
            scrollOffset: scrollOffset
        };
        this._eventOutput.emit('scrollend', eventData);
    }
    var transform = context.transform;
    if (sequentialScrollingOptimized) {
        var windowOffset = scrollOffset + this._scroll.groupStart;
        var translate = [
                0,
                0,
                0
            ];
        translate[this._direction] = windowOffset;
        transform = Transform.thenMove(transform, translate);
    }
    return {
        transform: transform,
        size: size,
        opacity: context.opacity,
        origin: context.origin,
        target: this.group.render()
    };
};
ScrollController.prototype.render = function render() {
    if (this.container) {
        return this.container.render.apply(this.container, arguments);
    } else {
        return this.id;
    }
};
module.exports = ScrollController;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./FlowLayoutNode":3,"./LayoutController":5,"./LayoutNode":6,"./LayoutNodeManager":7,"./LayoutUtility":8}],10:[function(require,module,exports){
var LayoutUtility = require('../LayoutUtility');
function LayoutDockHelper(context, options) {
    var size = context.size;
    this._size = size;
    this._context = context;
    this._options = options;
    this._z = options && options.translateZ ? options.translateZ : 0;
    if (options && options.margins) {
        var margins = LayoutUtility.normalizeMargins(options.margins);
        this._left = margins[3];
        this._top = margins[0];
        this._right = size[0] - margins[1];
        this._bottom = size[1] - margins[2];
    } else {
        this._left = 0;
        this._top = 0;
        this._right = size[0];
        this._bottom = size[1];
    }
}
LayoutDockHelper.prototype.parse = function (data) {
    for (var i = 0; i < data.length; i++) {
        var rule = data[i];
        var value = rule.length >= 3 ? rule[2] : undefined;
        if (rule[0] === 'top') {
            this.top(rule[1], value, rule.length >= 4 ? rule[3] : undefined);
        } else if (rule[0] === 'left') {
            this.left(rule[1], value, rule.length >= 4 ? rule[3] : undefined);
        } else if (rule[0] === 'right') {
            this.right(rule[1], value, rule.length >= 4 ? rule[3] : undefined);
        } else if (rule[0] === 'bottom') {
            this.bottom(rule[1], value, rule.length >= 4 ? rule[3] : undefined);
        } else if (rule[0] === 'fill') {
            this.fill(rule[1], rule.length >= 3 ? rule[2] : undefined);
        } else if (rule[0] === 'margins') {
            this.margins(rule[1]);
        }
    }
};
LayoutDockHelper.prototype.top = function (node, height, z) {
    if (height instanceof Array) {
        height = height[1];
    }
    if (height === undefined) {
        var size = this._context.resolveSize(node, [
                this._right - this._left,
                this._bottom - this._top
            ]);
        height = size[1];
    }
    this._context.set(node, {
        size: [
            this._right - this._left,
            height
        ],
        origin: [
            0,
            0
        ],
        align: [
            0,
            0
        ],
        translate: [
            this._left,
            this._top,
            z === undefined ? this._z : z
        ]
    });
    this._top += height;
    return this;
};
LayoutDockHelper.prototype.left = function (node, width, z) {
    if (width instanceof Array) {
        width = width[0];
    }
    if (width === undefined) {
        var size = this._context.resolveSize(node, [
                this._right - this._left,
                this._bottom - this._top
            ]);
        width = size[0];
    }
    this._context.set(node, {
        size: [
            width,
            this._bottom - this._top
        ],
        origin: [
            0,
            0
        ],
        align: [
            0,
            0
        ],
        translate: [
            this._left,
            this._top,
            z === undefined ? this._z : z
        ]
    });
    this._left += width;
    return this;
};
LayoutDockHelper.prototype.bottom = function (node, height, z) {
    if (height instanceof Array) {
        height = height[1];
    }
    if (height === undefined) {
        var size = this._context.resolveSize(node, [
                this._right - this._left,
                this._bottom - this._top
            ]);
        height = size[1];
    }
    this._context.set(node, {
        size: [
            this._right - this._left,
            height
        ],
        origin: [
            0,
            1
        ],
        align: [
            0,
            1
        ],
        translate: [
            this._left,
            -(this._size[1] - this._bottom),
            z === undefined ? this._z : z
        ]
    });
    this._bottom -= height;
    return this;
};
LayoutDockHelper.prototype.right = function (node, width, z) {
    if (width instanceof Array) {
        width = width[0];
    }
    if (node) {
        if (width === undefined) {
            var size = this._context.resolveSize(node, [
                    this._right - this._left,
                    this._bottom - this._top
                ]);
            width = size[0];
        }
        this._context.set(node, {
            size: [
                width,
                this._bottom - this._top
            ],
            origin: [
                1,
                0
            ],
            align: [
                1,
                0
            ],
            translate: [
                -(this._size[0] - this._right),
                this._top,
                z === undefined ? this._z : z
            ]
        });
    }
    if (width) {
        this._right -= width;
    }
    return this;
};
LayoutDockHelper.prototype.fill = function (node, z) {
    this._context.set(node, {
        size: [
            this._right - this._left,
            this._bottom - this._top
        ],
        translate: [
            this._left,
            this._top,
            z === undefined ? this._z : z
        ]
    });
    return this;
};
LayoutDockHelper.prototype.margins = function (margins) {
    margins = LayoutUtility.normalizeMargins(margins);
    this._left += margins[3];
    this._top += margins[0];
    this._right -= margins[1];
    this._bottom -= margins[2];
    return this;
};
LayoutUtility.registerHelper('dock', LayoutDockHelper);
module.exports = LayoutDockHelper;
},{"../LayoutUtility":8}],11:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var LayoutUtility = require('../LayoutUtility');
var capabilities = {
        sequence: true,
        direction: [
            Utility.Direction.Y,
            Utility.Direction.X
        ],
        scrolling: true,
        trueSize: true,
        sequentialScrollingOptimized: true
    };
var context;
var size;
var direction;
var alignment;
var lineDirection;
var lineLength;
var offset;
var margins;
var margin = [
        0,
        0
    ];
var spacing;
var justify;
var itemSize;
var getItemSize;
var lineNodes;
function _layoutLine(next, endReached) {
    if (!lineNodes.length) {
        return 0;
    }
    var i;
    var lineSize = [
            0,
            0
        ];
    var lineNode;
    for (i = 0; i < lineNodes.length; i++) {
        lineSize[direction] = Math.max(lineSize[direction], lineNodes[i].size[direction]);
        lineSize[lineDirection] += (i > 0 ? spacing[lineDirection] : 0) + lineNodes[i].size[lineDirection];
    }
    var justifyOffset = justify[lineDirection] ? (lineLength - lineSize[lineDirection]) / (lineNodes.length * 2) : 0;
    var lineOffset = (direction ? margins[3] : margins[0]) + justifyOffset;
    var scrollLength;
    for (i = 0; i < lineNodes.length; i++) {
        lineNode = lineNodes[i];
        var translate = [
                0,
                0,
                0
            ];
        translate[lineDirection] = lineOffset;
        translate[direction] = next ? offset : offset - lineSize[direction];
        scrollLength = 0;
        if (i === 0) {
            scrollLength = lineSize[direction];
            if (endReached && (next && !alignment || !next && alignment)) {
                scrollLength += direction ? margins[0] + margins[2] : margins[3] + margins[1];
            } else {
                scrollLength += spacing[direction];
            }
        }
        lineNode.set = {
            size: lineNode.size,
            translate: translate,
            scrollLength: scrollLength
        };
        lineOffset += lineNode.size[lineDirection] + spacing[lineDirection] + justifyOffset * 2;
    }
    for (i = 0; i < lineNodes.length; i++) {
        lineNode = next ? lineNodes[i] : lineNodes[lineNodes.length - 1 - i];
        context.set(lineNode.node, lineNode.set);
    }
    lineNodes = [];
    return lineSize[direction] + spacing[direction];
}
function _resolveNodeSize(node) {
    var localItemSize = itemSize;
    if (getItemSize) {
        localItemSize = getItemSize(node.renderNode, size);
    }
    if (localItemSize[0] === true || localItemSize[1] === true) {
        var result = context.resolveSize(node, size);
        if (localItemSize[0] !== true) {
            result[0] = itemSize[0];
        }
        if (localItemSize[1] !== true) {
            result[1] = itemSize[1];
        }
        return result;
    } else {
        return localItemSize;
    }
}
function CollectionLayout(context_, options) {
    context = context_;
    size = context.size;
    direction = context.direction;
    alignment = context.alignment;
    lineDirection = (direction + 1) % 2;
    if (options.gutter !== undefined && console.warn) {
        console.warn('gutter has been deprecated for CollectionLayout, use margins & spacing instead');
    }
    if (options.gutter && !options.margins && !options.spacing) {
        var gutter = Array.isArray(options.gutter) ? options.gutter : [
                options.gutter,
                options.gutter
            ];
        margins = [
            gutter[1],
            gutter[0],
            gutter[1],
            gutter[0]
        ];
        spacing = gutter;
    } else {
        margins = LayoutUtility.normalizeMargins(options.margins);
        spacing = options.spacing || 0;
        spacing = Array.isArray(spacing) ? spacing : [
            spacing,
            spacing
        ];
    }
    margin[0] = margins[direction ? 0 : 3];
    margin[1] = -margins[direction ? 2 : 1];
    justify = Array.isArray(options.justify) ? options.justify : options.justify ? [
        true,
        true
    ] : [
        false,
        false
    ];
    lineLength = size[lineDirection] - (direction ? margins[3] + margins[1] : margins[0] + margins[2]);
    var node;
    var nodeSize;
    var lineOffset;
    var bound;
    if (!options.itemSize) {
        itemSize = [
            true,
            true
        ];
    } else if (options.itemSize instanceof Function) {
        getItemSize = options.itemSize;
    } else if (options.itemSize[0] === undefined || options.itemSize[0] === undefined) {
        itemSize = [
            options.itemSize[0] === undefined ? size[0] : options.itemSize[0],
            options.itemSize[1] === undefined ? size[1] : options.itemSize[1]
        ];
    } else {
        itemSize = options.itemSize;
    }
    offset = context.scrollOffset + margin[alignment];
    bound = context.scrollEnd + margin[alignment];
    lineOffset = 0;
    lineNodes = [];
    while (offset < bound) {
        node = context.next();
        if (!node) {
            _layoutLine(true, true);
            break;
        }
        nodeSize = _resolveNodeSize(node);
        lineOffset += (lineNodes.length ? spacing[lineDirection] : 0) + nodeSize[lineDirection];
        if (lineOffset > lineLength) {
            offset += _layoutLine(true, !node);
            lineOffset = nodeSize[lineDirection];
        }
        lineNodes.push({
            node: node,
            size: nodeSize
        });
    }
    offset = context.scrollOffset + margin[alignment];
    bound = context.scrollStart + margin[alignment];
    lineOffset = 0;
    lineNodes = [];
    while (offset > bound) {
        node = context.prev();
        if (!node) {
            _layoutLine(false, true);
            break;
        }
        nodeSize = _resolveNodeSize(node);
        lineOffset += (lineNodes.length ? spacing[lineDirection] : 0) + nodeSize[lineDirection];
        if (lineOffset > lineLength) {
            offset -= _layoutLine(false, !node);
            lineOffset = nodeSize[lineDirection];
        }
        lineNodes.unshift({
            node: node,
            size: nodeSize
        });
    }
}
CollectionLayout.Capabilities = capabilities;
CollectionLayout.Name = 'CollectionLayout';
CollectionLayout.Description = 'Multi-cell collection-layout with margins & spacing';
module.exports = CollectionLayout;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../LayoutUtility":8}],12:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var capabilities = {
        sequence: true,
        direction: [
            Utility.Direction.X,
            Utility.Direction.Y
        ],
        scrolling: true
    };
function CoverLayout(context, options) {
    var node = context.next();
    if (!node) {
        return;
    }
    var size = context.size;
    var direction = context.direction;
    var itemSize = options.itemSize;
    var opacityStep = 0.2;
    var scaleStep = 0.1;
    var translateStep = 30;
    var zStart = 100;
    context.set(node, {
        size: itemSize,
        origin: [
            0.5,
            0.5
        ],
        align: [
            0.5,
            0.5
        ],
        translate: [
            0,
            0,
            zStart
        ],
        scrollLength: itemSize[direction]
    });
    var translate = itemSize[0] / 2;
    var opacity = 1 - opacityStep;
    var zIndex = zStart - 1;
    var scale = 1 - scaleStep;
    var prev = false;
    var endReached = false;
    node = context.next();
    if (!node) {
        node = context.prev();
        prev = true;
    }
    while (node) {
        context.set(node, {
            size: itemSize,
            origin: [
                0.5,
                0.5
            ],
            align: [
                0.5,
                0.5
            ],
            translate: direction ? [
                0,
                prev ? -translate : translate,
                zIndex
            ] : [
                prev ? -translate : translate,
                0,
                zIndex
            ],
            scale: [
                scale,
                scale,
                1
            ],
            opacity: opacity,
            scrollLength: itemSize[direction]
        });
        opacity -= opacityStep;
        scale -= scaleStep;
        translate += translateStep;
        zIndex--;
        if (translate >= size[direction] / 2) {
            endReached = true;
        } else {
            node = prev ? context.prev() : context.next();
            endReached = !node;
        }
        if (endReached) {
            if (prev) {
                break;
            }
            endReached = false;
            prev = true;
            node = context.prev();
            if (node) {
                translate = itemSize[direction] / 2;
                opacity = 1 - opacityStep;
                zIndex = zStart - 1;
                scale = 1 - scaleStep;
            }
        }
    }
}
CoverLayout.Capabilities = capabilities;
module.exports = CoverLayout;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],13:[function(require,module,exports){
module.exports = function CubeLayout(context, options) {
    var itemSize = options.itemSize;
    context.set(context.next(), {
        size: itemSize,
        origin: [
            0.5,
            0.5
        ],
        rotate: [
            0,
            Math.PI / 2,
            0
        ],
        translate: [
            itemSize[0] / 2,
            0,
            0
        ]
    });
    context.set(context.next(), {
        size: itemSize,
        origin: [
            0.5,
            0.5
        ],
        rotate: [
            0,
            Math.PI / 2,
            0
        ],
        translate: [
            -(itemSize[0] / 2),
            0,
            0
        ]
    });
    context.set(context.next(), {
        size: itemSize,
        origin: [
            0.5,
            0.5
        ],
        rotate: [
            Math.PI / 2,
            0,
            0
        ],
        translate: [
            0,
            -(itemSize[1] / 2),
            0
        ]
    });
    context.set(context.next(), {
        size: itemSize,
        origin: [
            0.5,
            0.5
        ],
        rotate: [
            Math.PI / 2,
            0,
            0
        ],
        translate: [
            0,
            itemSize[1] / 2,
            0
        ]
    });
};
},{}],14:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var LayoutUtility = require('../LayoutUtility');
var capabilities = {
        sequence: true,
        direction: [
            Utility.Direction.Y,
            Utility.Direction.X
        ],
        scrolling: false
    };
function GridLayout(context, options) {
    var size = context.size;
    if (options.gutter !== undefined && console.warn) {
        console.warn('gutter has been deprecated for GridLayout, use margins & spacing instead');
    }
    var spacing;
    if (options.gutter && !options.spacing) {
        spacing = options.gutter || 0;
    } else {
        spacing = options.spacing || 0;
    }
    spacing = Array.isArray(spacing) ? spacing : [
        spacing,
        spacing
    ];
    var margins = LayoutUtility.normalizeMargins(options.margins);
    var nodeSize = [
            (size[0] - ((options.cells[0] - 1) * spacing[0] + margins[1] + margins[3])) / options.cells[0],
            (size[1] - ((options.cells[1] - 1) * spacing[1] + margins[0] + margins[2])) / options.cells[1]
        ];
    function _layoutNode(node, col, row) {
        context.set(node, {
            size: nodeSize,
            translate: [
                (nodeSize[0] + spacing[0]) * col + margins[3],
                (nodeSize[1] + spacing[1]) * row + margins[0],
                0
            ]
        });
    }
    var row;
    var col;
    var node;
    if (context.direction === Utility.Direction.Y) {
        for (col = 0; col < options.cells[0]; col++) {
            for (row = 0; row < options.cells[1]; row++) {
                node = context.next();
                if (!node) {
                    return;
                }
                _layoutNode(node, col, row);
            }
        }
    } else {
        for (row = 0; row < options.cells[1]; row++) {
            for (col = 0; col < options.cells[0]; col++) {
                node = context.next();
                if (!node) {
                    return;
                }
                _layoutNode(node, col, row);
            }
        }
    }
}
GridLayout.Capabilities = capabilities;
module.exports = GridLayout;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../LayoutUtility":8}],15:[function(require,module,exports){
var LayoutDockHelper = require('../helpers/LayoutDockHelper');
module.exports = function HeaderFooterLayout(context, options) {
    var dock = new LayoutDockHelper(context, options);
    dock.top('header', options.headerSize || options.headerHeight);
    dock.bottom('footer', options.footerSize || options.footerHeight);
    dock.fill('content');
};
},{"../helpers/LayoutDockHelper":10}],16:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var LayoutUtility = require('../LayoutUtility');
var capabilities = {
        sequence: true,
        direction: [
            Utility.Direction.Y,
            Utility.Direction.X
        ],
        scrolling: true,
        trueSize: true,
        sequentialScrollingOptimized: true
    };
var set = {
        size: [
            0,
            0
        ],
        translate: [
            0,
            0,
            0
        ],
        scrollLength: undefined
    };
var margin = [
        0,
        0
    ];
function ListLayout(context, options) {
    var size = context.size;
    var direction = context.direction;
    var alignment = context.alignment;
    var revDirection = direction ? 0 : 1;
    var offset;
    var margins = LayoutUtility.normalizeMargins(options.margins);
    var spacing = options.spacing || 0;
    var node;
    var nodeSize;
    var itemSize;
    var getItemSize;
    var lastSectionBeforeVisibleCell;
    var lastSectionBeforeVisibleCellOffset;
    var lastSectionBeforeVisibleCellLength;
    var lastSectionBeforeVisibleCellScrollLength;
    var firstVisibleCell;
    var lastNode;
    var lastCellOffsetInFirstVisibleSection;
    var isSectionCallback = options.isSectionCallback;
    var bound;
    set.size[0] = size[0];
    set.size[1] = size[1];
    set.size[revDirection] -= margins[1 - revDirection] + margins[3 - revDirection];
    set.translate[0] = 0;
    set.translate[1] = 0;
    set.translate[2] = 0;
    set.translate[revDirection] = margins[direction ? 3 : 0];
    if (options.itemSize === true || !options.hasOwnProperty('itemSize')) {
        itemSize = true;
    } else if (options.itemSize instanceof Function) {
        getItemSize = options.itemSize;
    } else {
        itemSize = options.itemSize === undefined ? size[direction] : options.itemSize;
    }
    margin[0] = margins[direction ? 0 : 3];
    margin[1] = -margins[direction ? 2 : 1];
    offset = context.scrollOffset + margin[alignment];
    bound = context.scrollEnd + margin[alignment];
    while (offset < bound) {
        lastNode = node;
        node = context.next();
        if (!node) {
            if (lastNode && !alignment) {
                set.scrollLength = nodeSize + margin[0] + -margin[1];
                context.set(lastNode, set);
            }
            break;
        }
        nodeSize = getItemSize ? getItemSize(node.renderNode) : itemSize;
        nodeSize = nodeSize === true ? context.resolveSize(node, size)[direction] : nodeSize;
        set.size[direction] = nodeSize;
        set.translate[direction] = offset + (alignment ? spacing : 0);
        set.scrollLength = nodeSize + spacing;
        context.set(node, set);
        offset += set.scrollLength;
        if (isSectionCallback && isSectionCallback(node.renderNode)) {
            set.translate[direction] = Math.max(margin[0], set.translate[direction]);
            context.set(node, set);
            if (!firstVisibleCell) {
                lastSectionBeforeVisibleCell = node;
                lastSectionBeforeVisibleCellOffset = offset - nodeSize;
                lastSectionBeforeVisibleCellLength = nodeSize;
                lastSectionBeforeVisibleCellScrollLength = nodeSize;
            } else if (lastCellOffsetInFirstVisibleSection === undefined) {
                lastCellOffsetInFirstVisibleSection = offset - nodeSize;
            }
        } else if (!firstVisibleCell && offset >= 0) {
            firstVisibleCell = node;
        }
    }
    node = undefined;
    offset = context.scrollOffset + margin[alignment];
    bound = context.scrollStart + margin[alignment];
    while (offset > bound) {
        lastNode = node;
        node = context.prev();
        if (!node) {
            if (lastNode && alignment) {
                set.scrollLength = nodeSize + margin[0] + -margin[1];
                context.set(lastNode, set);
                if (lastSectionBeforeVisibleCell === lastNode) {
                    lastSectionBeforeVisibleCellScrollLength = set.scrollLength;
                }
            }
            break;
        }
        nodeSize = getItemSize ? getItemSize(node.renderNode) : itemSize;
        nodeSize = nodeSize === true ? context.resolveSize(node, size)[direction] : nodeSize;
        set.scrollLength = nodeSize + spacing;
        offset -= set.scrollLength;
        set.size[direction] = nodeSize;
        set.translate[direction] = offset + (alignment ? spacing : 0);
        context.set(node, set);
        if (isSectionCallback && isSectionCallback(node.renderNode)) {
            set.translate[direction] = Math.max(margin[0], set.translate[direction]);
            context.set(node, set);
            if (!lastSectionBeforeVisibleCell) {
                lastSectionBeforeVisibleCell = node;
                lastSectionBeforeVisibleCellOffset = offset;
                lastSectionBeforeVisibleCellLength = nodeSize;
                lastSectionBeforeVisibleCellScrollLength = set.scrollLength;
            }
        } else if (offset + nodeSize >= 0) {
            firstVisibleCell = node;
            if (lastSectionBeforeVisibleCell) {
                lastCellOffsetInFirstVisibleSection = offset + nodeSize;
            }
            lastSectionBeforeVisibleCell = undefined;
        }
    }
    if (isSectionCallback && !lastSectionBeforeVisibleCell) {
        node = context.prev();
        while (node) {
            if (isSectionCallback(node.renderNode)) {
                lastSectionBeforeVisibleCell = node;
                nodeSize = options.itemSize || context.resolveSize(node, size)[direction];
                lastSectionBeforeVisibleCellOffset = offset - nodeSize;
                lastSectionBeforeVisibleCellLength = nodeSize;
                lastSectionBeforeVisibleCellScrollLength = undefined;
                break;
            } else {
                node = context.prev();
            }
        }
    }
    if (lastSectionBeforeVisibleCell) {
        var correctedOffset = Math.max(margin[0], lastSectionBeforeVisibleCellOffset);
        if (lastCellOffsetInFirstVisibleSection !== undefined && lastSectionBeforeVisibleCellLength > lastCellOffsetInFirstVisibleSection - margin[0]) {
            correctedOffset = lastCellOffsetInFirstVisibleSection - lastSectionBeforeVisibleCellLength;
        }
        set.size[direction] = lastSectionBeforeVisibleCellLength;
        set.translate[direction] = correctedOffset;
        set.scrollLength = lastSectionBeforeVisibleCellScrollLength;
        context.set(lastSectionBeforeVisibleCell, set);
    }
}
ListLayout.Capabilities = capabilities;
ListLayout.Name = 'ListLayout';
ListLayout.Description = 'List-layout with margins, spacing and sticky headers';
module.exports = ListLayout;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../LayoutUtility":8}],17:[function(require,module,exports){
var LayoutDockHelper = require('../helpers/LayoutDockHelper');
module.exports = function NavBarLayout(context, options) {
    var dock = new LayoutDockHelper(context, {
            margins: options.margins,
            translateZ: 1
        });
    context.set('background', { size: context.size });
    var node;
    var i;
    var rightItems = context.get('rightItems');
    if (rightItems) {
        for (i = 0; i < rightItems.length; i++) {
            node = context.get(rightItems[i]);
            dock.right(node, options.rightItemWidth || options.itemWidth);
            dock.right(undefined, options.rightItemSpacer || options.itemSpacer);
        }
    }
    var leftItems = context.get('leftItems');
    if (leftItems) {
        for (i = 0; i < leftItems.length; i++) {
            node = context.get(leftItems[i]);
            dock.left(node, options.leftItemWidth || options.itemWidth);
            dock.left(undefined, options.leftItemSpacer || options.itemSpacer);
        }
    }
    dock.fill('title');
};
},{"../helpers/LayoutDockHelper":10}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJnbG9iYWwtbm8tZmFtb3VzLnRlbXBsYXRlLmpzIiwic3JjL0ZsZXhTY3JvbGxWaWV3LmpzIiwic3JjL0Zsb3dMYXlvdXROb2RlLmpzIiwic3JjL0xheW91dENvbnRleHQuanMiLCJzcmMvTGF5b3V0Q29udHJvbGxlci5qcyIsInNyYy9MYXlvdXROb2RlLmpzIiwic3JjL0xheW91dE5vZGVNYW5hZ2VyLmpzIiwic3JjL0xheW91dFV0aWxpdHkuanMiLCJzcmMvU2Nyb2xsQ29udHJvbGxlci5qcyIsInNyYy9oZWxwZXJzL0xheW91dERvY2tIZWxwZXIuanMiLCJzcmMvbGF5b3V0cy9Db2xsZWN0aW9uTGF5b3V0LmpzIiwic3JjL2xheW91dHMvQ292ZXJMYXlvdXQuanMiLCJzcmMvbGF5b3V0cy9DdWJlTGF5b3V0LmpzIiwic3JjL2xheW91dHMvR3JpZExheW91dC5qcyIsInNyYy9sYXlvdXRzL0hlYWRlckZvb3RlckxheW91dC5qcyIsInNyYy9sYXlvdXRzL0xpc3RMYXlvdXQuanMiLCJzcmMvbGF5b3V0cy9OYXZCYXJMYXlvdXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2paQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDcGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuY0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzlzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpZiAodHlwZW9mIGlqemVyZW5oZWluID09PSAndW5kZWZpbmVkJykge1xuICAgIGlqemVyZW5oZWluID0ge307XG59XG5cbmlqemVyZW5oZWluLkZsZXhTY3JvbGxWaWV3ID0gcmVxdWlyZSgnLi9zcmMvRmxleFNjcm9sbFZpZXcnKTtcbmlqemVyZW5oZWluLkZsb3dMYXlvdXROb2RlID0gcmVxdWlyZSgnLi9zcmMvRmxvd0xheW91dE5vZGUnKTtcbmlqemVyZW5oZWluLkxheW91dENvbnRleHQgPSByZXF1aXJlKCcuL3NyYy9MYXlvdXRDb250ZXh0Jyk7XG5panplcmVuaGVpbi5MYXlvdXRDb250cm9sbGVyID0gcmVxdWlyZSgnLi9zcmMvTGF5b3V0Q29udHJvbGxlcicpO1xuaWp6ZXJlbmhlaW4uTGF5b3V0Tm9kZSA9IHJlcXVpcmUoJy4vc3JjL0xheW91dE5vZGUnKTtcbmlqemVyZW5oZWluLkxheW91dE5vZGVNYW5hZ2VyID0gcmVxdWlyZSgnLi9zcmMvTGF5b3V0Tm9kZU1hbmFnZXInKTtcbmlqemVyZW5oZWluLkxheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuL3NyYy9MYXlvdXRVdGlsaXR5Jyk7XG5panplcmVuaGVpbi5TY3JvbGxDb250cm9sbGVyID0gcmVxdWlyZSgnLi9zcmMvU2Nyb2xsQ29udHJvbGxlcicpO1xuLy9panplcmVuaGVpbi5TY3JvbGxWaWV3ID0gcmVxdWlyZSgnLi9zcmMvU2Nyb2xsVmlldycpO1xuXG5panplcmVuaGVpbi5sYXlvdXQgPSBpanplcmVuaGVpbi5sYXlvdXQgfHwge307XG5cbmlqemVyZW5oZWluLmxheW91dC5Db2xsZWN0aW9uTGF5b3V0ID0gcmVxdWlyZSgnLi9zcmMvbGF5b3V0cy9Db2xsZWN0aW9uTGF5b3V0Jyk7XG5panplcmVuaGVpbi5sYXlvdXQuQ292ZXJMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL0NvdmVyTGF5b3V0Jyk7XG5panplcmVuaGVpbi5sYXlvdXQuQ3ViZUxheW91dCA9IHJlcXVpcmUoJy4vc3JjL2xheW91dHMvQ3ViZUxheW91dCcpO1xuaWp6ZXJlbmhlaW4ubGF5b3V0LkdyaWRMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL0dyaWRMYXlvdXQnKTtcbmlqemVyZW5oZWluLmxheW91dC5IZWFkZXJGb290ZXJMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL0hlYWRlckZvb3RlckxheW91dCcpO1xuaWp6ZXJlbmhlaW4ubGF5b3V0Lkxpc3RMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL0xpc3RMYXlvdXQnKTtcbmlqemVyZW5oZWluLmxheW91dC5OYXZCYXJMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL05hdkJhckxheW91dCcpO1xuLy9panplcmVuaGVpbi5sYXlvdXQuVGFibGVMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL1RhYmxlTGF5b3V0Jyk7XG5cbmlqemVyZW5oZWluLmhlbHBlcnMgPSBpanplcmVuaGVpbi5oZWxwZXJzIHx8IHt9O1xuXG5panplcmVuaGVpbi5oZWxwZXJzLkxheW91dERvY2tIZWxwZXIgPSByZXF1aXJlKCcuL3NyYy9oZWxwZXJzL0xheW91dERvY2tIZWxwZXInKTtcbiIsInZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgU2Nyb2xsQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vU2Nyb2xsQ29udHJvbGxlcicpO1xudmFyIExpc3RMYXlvdXQgPSByZXF1aXJlKCcuL2xheW91dHMvTGlzdExheW91dCcpO1xudmFyIFB1bGxUb1JlZnJlc2hTdGF0ZSA9IHtcbiAgICAgICAgSElEREVOOiAwLFxuICAgICAgICBQVUxMSU5HOiAxLFxuICAgICAgICBBQ1RJVkU6IDIsXG4gICAgICAgIENPTVBMRVRFRDogMyxcbiAgICAgICAgSElERElORzogNFxuICAgIH07XG5mdW5jdGlvbiBGbGV4U2Nyb2xsVmlldyhvcHRpb25zKSB7XG4gICAgU2Nyb2xsQ29udHJvbGxlci5jYWxsKHRoaXMsIExheW91dFV0aWxpdHkuY29tYmluZU9wdGlvbnMoRmxleFNjcm9sbFZpZXcuREVGQVVMVF9PUFRJT05TLCBvcHRpb25zKSk7XG4gICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSA9IDA7XG4gICAgdGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSA9IDA7XG4gICAgdGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEgPSAwO1xufVxuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZSk7XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGbGV4U2Nyb2xsVmlldztcbkZsZXhTY3JvbGxWaWV3LlB1bGxUb1JlZnJlc2hTdGF0ZSA9IFB1bGxUb1JlZnJlc2hTdGF0ZTtcbkZsZXhTY3JvbGxWaWV3LkRFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBsYXlvdXQ6IExpc3RMYXlvdXQsXG4gICAgZGlyZWN0aW9uOiB1bmRlZmluZWQsXG4gICAgcGFnaW5hdGVkOiBmYWxzZSxcbiAgICBhbGlnbm1lbnQ6IDAsXG4gICAgZmxvdzogZmFsc2UsXG4gICAgbW91c2VNb3ZlOiBmYWxzZSxcbiAgICB1c2VDb250YWluZXI6IGZhbHNlLFxuICAgIHZpc2libGVJdGVtVGhyZXNzaG9sZDogMC41LFxuICAgIHB1bGxUb1JlZnJlc2hIZWFkZXI6IHVuZGVmaW5lZCxcbiAgICBwdWxsVG9SZWZyZXNoRm9vdGVyOiB1bmRlZmluZWQsXG4gICAgbGVhZGluZ1Njcm9sbFZpZXc6IHVuZGVmaW5lZCxcbiAgICB0cmFpbGluZ1Njcm9sbFZpZXc6IHVuZGVmaW5lZFxufTtcbkZsZXhTY3JvbGxWaWV3LnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5zZXRPcHRpb25zLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMucHVsbFRvUmVmcmVzaEhlYWRlciB8fCBvcHRpb25zLnB1bGxUb1JlZnJlc2hGb290ZXIgfHwgdGhpcy5fcHVsbFRvUmVmcmVzaCkge1xuICAgICAgICBpZiAob3B0aW9ucy5wdWxsVG9SZWZyZXNoSGVhZGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9wdWxsVG9SZWZyZXNoID0gdGhpcy5fcHVsbFRvUmVmcmVzaCB8fCBbXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHVuZGVmaW5lZFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGlmICghdGhpcy5fcHVsbFRvUmVmcmVzaFswXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2hbMF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiBQdWxsVG9SZWZyZXNoU3RhdGUuSElEREVOLFxuICAgICAgICAgICAgICAgICAgICBwcmV2U3RhdGU6IFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4sXG4gICAgICAgICAgICAgICAgICAgIGZvb3RlcjogZmFsc2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaFswXS5ub2RlID0gb3B0aW9ucy5wdWxsVG9SZWZyZXNoSGVhZGVyO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLm9wdGlvbnMucHVsbFRvUmVmcmVzaEhlYWRlciAmJiB0aGlzLl9wdWxsVG9SZWZyZXNoKSB7XG4gICAgICAgICAgICB0aGlzLl9wdWxsVG9SZWZyZXNoWzBdID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLnB1bGxUb1JlZnJlc2hGb290ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2ggPSB0aGlzLl9wdWxsVG9SZWZyZXNoIHx8IFtcbiAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9wdWxsVG9SZWZyZXNoWzFdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaFsxXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4sXG4gICAgICAgICAgICAgICAgICAgIHByZXZTdGF0ZTogUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERFTixcbiAgICAgICAgICAgICAgICAgICAgZm9vdGVyOiB0cnVlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2hbMV0ubm9kZSA9IG9wdGlvbnMucHVsbFRvUmVmcmVzaEZvb3RlcjtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5vcHRpb25zLnB1bGxUb1JlZnJlc2hGb290ZXIgJiYgdGhpcy5fcHVsbFRvUmVmcmVzaCkge1xuICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaFsxXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcHVsbFRvUmVmcmVzaCAmJiAhdGhpcy5fcHVsbFRvUmVmcmVzaFswXSAmJiAhdGhpcy5fcHVsbFRvUmVmcmVzaFsxXSkge1xuICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuc2VxdWVuY2VGcm9tID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICByZXR1cm4gdGhpcy5zZXREYXRhU291cmNlKG5vZGUpO1xufTtcbkZsZXhTY3JvbGxWaWV3LnByb3RvdHlwZS5nZXRDdXJyZW50SW5kZXggPSBmdW5jdGlvbiBnZXRDdXJyZW50SW5kZXgoKSB7XG4gICAgdmFyIGl0ZW0gPSB0aGlzLmdldEZpcnN0VmlzaWJsZUl0ZW0oKTtcbiAgICByZXR1cm4gaXRlbSA/IGl0ZW0udmlld1NlcXVlbmNlLmdldEluZGV4KCkgOiAtMTtcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ29Ub1BhZ2UgPSBmdW5jdGlvbiBnb1RvUGFnZShpbmRleCkge1xuICAgIHZhciB2aWV3U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2U7XG4gICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHdoaWxlICh2aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKSA8IGluZGV4KSB7XG4gICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgICAgIGlmICghdmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAodmlld1NlcXVlbmNlLmdldEluZGV4KCkgPiBpbmRleCkge1xuICAgICAgICB2aWV3U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMuZ29Ub1JlbmRlck5vZGUodmlld1NlcXVlbmNlLmdldCgpKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ2V0T2Zmc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZTtcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ2V0UG9zaXRpb24gPSBGbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ2V0T2Zmc2V0O1xuZnVuY3Rpb24gX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBzdGF0ZSkge1xuICAgIGlmIChwdWxsVG9SZWZyZXNoLnN0YXRlICE9PSBzdGF0ZSkge1xuICAgICAgICBwdWxsVG9SZWZyZXNoLnN0YXRlID0gc3RhdGU7XG4gICAgICAgIGlmIChwdWxsVG9SZWZyZXNoLm5vZGUgJiYgcHVsbFRvUmVmcmVzaC5ub2RlLnNldFB1bGxUb1JlZnJlc2hTdGF0dXMpIHtcbiAgICAgICAgICAgIHB1bGxUb1JlZnJlc2gubm9kZS5zZXRQdWxsVG9SZWZyZXNoU3RhdHVzKHN0YXRlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIF9nZXRQdWxsVG9SZWZyZXNoKGZvb3Rlcikge1xuICAgIHJldHVybiB0aGlzLl9wdWxsVG9SZWZyZXNoID8gdGhpcy5fcHVsbFRvUmVmcmVzaFtmb290ZXIgPyAxIDogMF0gOiB1bmRlZmluZWQ7XG59XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuX3Bvc3RMYXlvdXQgPSBmdW5jdGlvbiAoc2l6ZSwgc2Nyb2xsT2Zmc2V0KSB7XG4gICAgaWYgKCF0aGlzLl9wdWxsVG9SZWZyZXNoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IHNpemVbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICB9XG4gICAgdmFyIHByZXZIZWlnaHQ7XG4gICAgdmFyIG5leHRIZWlnaHQ7XG4gICAgdmFyIHRvdGFsSGVpZ2h0O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjsgaSsrKSB7XG4gICAgICAgIHZhciBwdWxsVG9SZWZyZXNoID0gdGhpcy5fcHVsbFRvUmVmcmVzaFtpXTtcbiAgICAgICAgaWYgKHB1bGxUb1JlZnJlc2gpIHtcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBwdWxsVG9SZWZyZXNoLm5vZGUuZ2V0U2l6ZSgpW3RoaXMuX2RpcmVjdGlvbl07XG4gICAgICAgICAgICB2YXIgcHVsbExlbmd0aCA9IHB1bGxUb1JlZnJlc2gubm9kZS5nZXRQdWxsVG9SZWZyZXNoU2l6ZSA/IHB1bGxUb1JlZnJlc2gubm9kZS5nZXRQdWxsVG9SZWZyZXNoU2l6ZSgpW3RoaXMuX2RpcmVjdGlvbl0gOiBsZW5ndGg7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0O1xuICAgICAgICAgICAgaWYgKCFwdWxsVG9SZWZyZXNoLmZvb3Rlcikge1xuICAgICAgICAgICAgICAgIHByZXZIZWlnaHQgPSB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KGZhbHNlKTtcbiAgICAgICAgICAgICAgICBwcmV2SGVpZ2h0ID0gcHJldkhlaWdodCA9PT0gdW5kZWZpbmVkID8gLTEgOiBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgICAgIG9mZnNldCA9IHByZXZIZWlnaHQgPj0gMCA/IHNjcm9sbE9mZnNldCAtIHByZXZIZWlnaHQgOiBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRIZWlnaHQgPSB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0SGVpZ2h0ID0gbmV4dEhlaWdodCA9PT0gdW5kZWZpbmVkID8gLTEgOiBuZXh0SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB0b3RhbEhlaWdodCA9IHByZXZIZWlnaHQgPj0gMCAmJiBuZXh0SGVpZ2h0ID49IDAgPyBwcmV2SGVpZ2h0ICsgbmV4dEhlaWdodCA6IC0xO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG90YWxIZWlnaHQgPj0gMCAmJiB0b3RhbEhlaWdodCA8IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gTWF0aC5yb3VuZChzY3JvbGxPZmZzZXQgLSBzaXplW3RoaXMuX2RpcmVjdGlvbl0gKyBuZXh0SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV4dEhlaWdodCA9IG5leHRIZWlnaHQgPT09IHVuZGVmaW5lZCA/IG5leHRIZWlnaHQgPSB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KHRydWUpIDogbmV4dEhlaWdodDtcbiAgICAgICAgICAgICAgICBuZXh0SGVpZ2h0ID0gbmV4dEhlaWdodCA9PT0gdW5kZWZpbmVkID8gLTEgOiBuZXh0SGVpZ2h0O1xuICAgICAgICAgICAgICAgIG9mZnNldCA9IG5leHRIZWlnaHQgPj0gMCA/IHNjcm9sbE9mZnNldCArIG5leHRIZWlnaHQgOiBzaXplW3RoaXMuX2RpcmVjdGlvbl0gKyAxO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2SGVpZ2h0ID0gcHJldkhlaWdodCA9PT0gdW5kZWZpbmVkID8gdGhpcy5fY2FsY1Njcm9sbEhlaWdodChmYWxzZSkgOiBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBwcmV2SGVpZ2h0ID0gcHJldkhlaWdodCA9PT0gdW5kZWZpbmVkID8gLTEgOiBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB0b3RhbEhlaWdodCA9IHByZXZIZWlnaHQgPj0gMCAmJiBuZXh0SGVpZ2h0ID49IDAgPyBwcmV2SGVpZ2h0ICsgbmV4dEhlaWdodCA6IC0xO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG90YWxIZWlnaHQgPj0gMCAmJiB0b3RhbEhlaWdodCA8IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gTWF0aC5yb3VuZChzY3JvbGxPZmZzZXQgLSBwcmV2SGVpZ2h0ICsgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvZmZzZXQgPSAtKG9mZnNldCAtIHNpemVbdGhpcy5fZGlyZWN0aW9uXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdmlzaWJsZVBlcmMgPSBNYXRoLm1heChNYXRoLm1pbihvZmZzZXQgLyBwdWxsTGVuZ3RoLCAxKSwgMCk7XG4gICAgICAgICAgICBzd2l0Y2ggKHB1bGxUb1JlZnJlc2guc3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERFTjpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZpc2libGVQZXJjID49IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgUHVsbFRvUmVmcmVzaFN0YXRlLkFDVElWRSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob2Zmc2V0ID49IDAuMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBQdWxsVG9SZWZyZXNoU3RhdGUuUFVMTElORyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFB1bGxUb1JlZnJlc2hTdGF0ZS5QVUxMSU5HOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCAmJiB2aXNpYmxlUGVyYyA+PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgUHVsbFRvUmVmcmVzaFN0YXRlLkFDVElWRSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvZmZzZXQgPCAwLjIpIHtcbiAgICAgICAgICAgICAgICAgICAgX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBQdWxsVG9SZWZyZXNoU3RhdGUuSElEREVOKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkU6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFB1bGxUb1JlZnJlc2hTdGF0ZS5DT01QTEVURUQ6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ID49IDAuMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBQdWxsVG9SZWZyZXNoU3RhdGUuSElERElORyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfc2V0UHVsbFRvUmVmcmVzaFN0YXRlKHB1bGxUb1JlZnJlc2gsIFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQdWxsVG9SZWZyZXNoU3RhdGUuSElERElORzpcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0IDwgMC4yKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERFTik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHB1bGxUb1JlZnJlc2guc3RhdGUgIT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dE5vZGUgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJOb2RlOiBwdWxsVG9SZWZyZXNoLm5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2OiAhcHVsbFRvUmVmcmVzaC5mb290ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBwdWxsVG9SZWZyZXNoLmZvb3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiAhcHVsbFRvUmVmcmVzaC5mb290ZXIgPyAtLXRoaXMuX25vZGVzLl9jb250ZXh0U3RhdGUucHJldkdldEluZGV4IDogKyt0aGlzLl9ub2Rlcy5fY29udGV4dFN0YXRlLm5leHRHZXRJbmRleFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICAgICAgaWYgKHB1bGxUb1JlZnJlc2guc3RhdGUgPT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoID0gbGVuZ3RoO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoID0gTWF0aC5taW4ob2Zmc2V0LCBsZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgc2V0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemVbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZVsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtMC4wMDFcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxMZW5ndGg6IHNjcm9sbExlbmd0aFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHNldC5zaXplW3RoaXMuX2RpcmVjdGlvbl0gPSBNYXRoLm1heChNYXRoLm1pbihvZmZzZXQsIHB1bGxMZW5ndGgpLCAwKTtcbiAgICAgICAgICAgICAgICBzZXQudHJhbnNsYXRlW3RoaXMuX2RpcmVjdGlvbl0gPSBwdWxsVG9SZWZyZXNoLmZvb3RlciA/IHNpemVbdGhpcy5fZGlyZWN0aW9uXSAtIGxlbmd0aCA6IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZXMuX2NvbnRleHQuc2V0KGNvbnRleHROb2RlLCBzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcbkZsZXhTY3JvbGxWaWV3LnByb3RvdHlwZS5zaG93UHVsbFRvUmVmcmVzaCA9IGZ1bmN0aW9uIChmb290ZXIpIHtcbiAgICB2YXIgcHVsbFRvUmVmcmVzaCA9IF9nZXRQdWxsVG9SZWZyZXNoLmNhbGwodGhpcywgZm9vdGVyKTtcbiAgICBpZiAocHVsbFRvUmVmcmVzaCkge1xuICAgICAgICBfc2V0UHVsbFRvUmVmcmVzaFN0YXRlKHB1bGxUb1JlZnJlc2gsIFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUpO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgPSB0cnVlO1xuICAgIH1cbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuaGlkZVB1bGxUb1JlZnJlc2ggPSBmdW5jdGlvbiAoZm9vdGVyKSB7XG4gICAgdmFyIHB1bGxUb1JlZnJlc2ggPSBfZ2V0UHVsbFRvUmVmcmVzaC5jYWxsKHRoaXMsIGZvb3Rlcik7XG4gICAgaWYgKHB1bGxUb1JlZnJlc2ggJiYgcHVsbFRvUmVmcmVzaC5zdGF0ZSA9PT0gUHVsbFRvUmVmcmVzaFN0YXRlLkFDVElWRSkge1xuICAgICAgICBfc2V0UHVsbFRvUmVmcmVzaFN0YXRlKHB1bGxUb1JlZnJlc2gsIFB1bGxUb1JlZnJlc2hTdGF0ZS5DT01QTEVURUQpO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuaXNQdWxsVG9SZWZyZXNoVmlzaWJsZSA9IGZ1bmN0aW9uIChmb290ZXIpIHtcbiAgICB2YXIgcHVsbFRvUmVmcmVzaCA9IF9nZXRQdWxsVG9SZWZyZXNoLmNhbGwodGhpcywgZm9vdGVyKTtcbiAgICByZXR1cm4gcHVsbFRvUmVmcmVzaCA/IHB1bGxUb1JlZnJlc2guc3RhdGUgPT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUgOiBmYWxzZTtcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuYXBwbHlTY3JvbGxGb3JjZSA9IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgIHZhciBsZWFkaW5nU2Nyb2xsVmlldyA9IHRoaXMub3B0aW9ucy5sZWFkaW5nU2Nyb2xsVmlldztcbiAgICB2YXIgdHJhaWxpbmdTY3JvbGxWaWV3ID0gdGhpcy5vcHRpb25zLnRyYWlsaW5nU2Nyb2xsVmlldztcbiAgICBpZiAoIWxlYWRpbmdTY3JvbGxWaWV3ICYmICF0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgcmV0dXJuIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmFwcGx5U2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgfVxuICAgIHZhciBwYXJ0aWFsRGVsdGE7XG4gICAgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICBpZiAobGVhZGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IGxlYWRpbmdTY3JvbGxWaWV3LmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhICs9IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGxlYWRpbmdTY3JvbGxWaWV3LmFwcGx5U2Nyb2xsRm9yY2UocGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSB0aGlzLmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5hcHBseVNjcm9sbEZvcmNlLmNhbGwodGhpcywgcGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKz0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LmFwcGx5U2Nyb2xsRm9yY2UoZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5hcHBseVNjcm9sbEZvcmNlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IHRyYWlsaW5nU2Nyb2xsVmlldy5jYW5TY3JvbGwoZGVsdGEpO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LmFwcGx5U2Nyb2xsRm9yY2UocGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhICs9IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVhZGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IHRoaXMuY2FuU2Nyb2xsKGRlbHRhKTtcbiAgICAgICAgICAgIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmFwcGx5U2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCBwYXJ0aWFsRGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBsZWFkaW5nU2Nyb2xsVmlldy5hcHBseVNjcm9sbEZvcmNlKGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX2xlYWRpbmdTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5hcHBseVNjcm9sbEZvcmNlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUudXBkYXRlU2Nyb2xsRm9yY2UgPSBmdW5jdGlvbiAocHJldkRlbHRhLCBuZXdEZWx0YSkge1xuICAgIHZhciBsZWFkaW5nU2Nyb2xsVmlldyA9IHRoaXMub3B0aW9ucy5sZWFkaW5nU2Nyb2xsVmlldztcbiAgICB2YXIgdHJhaWxpbmdTY3JvbGxWaWV3ID0gdGhpcy5vcHRpb25zLnRyYWlsaW5nU2Nyb2xsVmlldztcbiAgICBpZiAoIWxlYWRpbmdTY3JvbGxWaWV3ICYmICF0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgcmV0dXJuIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgcHJldkRlbHRhLCBuZXdEZWx0YSk7XG4gICAgfVxuICAgIHZhciBwYXJ0aWFsRGVsdGE7XG4gICAgdmFyIGRlbHRhID0gbmV3RGVsdGEgLSBwcmV2RGVsdGE7XG4gICAgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICBpZiAobGVhZGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IGxlYWRpbmdTY3JvbGxWaWV3LmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICBsZWFkaW5nU2Nyb2xsVmlldy51cGRhdGVTY3JvbGxGb3JjZSh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhICsgcGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX2xlYWRpbmdTY3JvbGxWaWV3RGVsdGEgKz0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFpbGluZ1Njcm9sbFZpZXcgJiYgZGVsdGEpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IHRoaXMuY2FuU2Nyb2xsKGRlbHRhKTtcbiAgICAgICAgICAgIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArIHBhcnRpYWxEZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhICs9IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhICs9IGRlbHRhO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSArIGRlbHRhKTtcbiAgICAgICAgfSBlbHNlIGlmIChkZWx0YSkge1xuICAgICAgICAgICAgU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUudXBkYXRlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhICsgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IHRyYWlsaW5nU2Nyb2xsVmlldy5jYW5TY3JvbGwoZGVsdGEpO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSArIHBhcnRpYWxEZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSArPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxlYWRpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSB0aGlzLmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVTY3JvbGxGb3JjZS5jYWxsKHRoaXMsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKyBwYXJ0aWFsRGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBsZWFkaW5nU2Nyb2xsVmlldy51cGRhdGVTY3JvbGxGb3JjZSh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhICsgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArIGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLnJlbGVhc2VTY3JvbGxGb3JjZSA9IGZ1bmN0aW9uIChkZWx0YSwgdmVsb2NpdHkpIHtcbiAgICB2YXIgbGVhZGluZ1Njcm9sbFZpZXcgPSB0aGlzLm9wdGlvbnMubGVhZGluZ1Njcm9sbFZpZXc7XG4gICAgdmFyIHRyYWlsaW5nU2Nyb2xsVmlldyA9IHRoaXMub3B0aW9ucy50cmFpbGluZ1Njcm9sbFZpZXc7XG4gICAgaWYgKCFsZWFkaW5nU2Nyb2xsVmlldyAmJiAhdHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgIHJldHVybiBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCBkZWx0YSwgdmVsb2NpdHkpO1xuICAgIH1cbiAgICB2YXIgcGFydGlhbERlbHRhO1xuICAgIGlmIChkZWx0YSA8IDApIHtcbiAgICAgICAgaWYgKGxlYWRpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSBNYXRoLm1heCh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGxlYWRpbmdTY3JvbGxWaWV3LnJlbGVhc2VTY3JvbGxGb3JjZSh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IDAgOiB2ZWxvY2l0eSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyYWlsaW5nU2Nyb2xsVmlldykge1xuICAgICAgICAgICAgcGFydGlhbERlbHRhID0gTWF0aC5tYXgodGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IDAgOiB2ZWxvY2l0eSk7XG4gICAgICAgICAgICB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSAtPSBkZWx0YTtcbiAgICAgICAgICAgIHRyYWlsaW5nU2Nyb2xsVmlldy5yZWxlYXNlU2Nyb2xsRm9yY2UodGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEsIGRlbHRhID8gdmVsb2NpdHkgOiAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgLT0gZGVsdGE7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IHZlbG9jaXR5IDogMCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSBNYXRoLm1pbih0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LnJlbGVhc2VTY3JvbGxGb3JjZSh0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEgPyAwIDogdmVsb2NpdHkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZWFkaW5nU2Nyb2xsVmlldykge1xuICAgICAgICAgICAgcGFydGlhbERlbHRhID0gTWF0aC5taW4odGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IDAgOiB2ZWxvY2l0eSk7XG4gICAgICAgICAgICB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhIC09IGRlbHRhO1xuICAgICAgICAgICAgbGVhZGluZ1Njcm9sbFZpZXcucmVsZWFzZVNjcm9sbEZvcmNlKHRoaXMuX2xlYWRpbmdTY3JvbGxWaWV3RGVsdGEsIGRlbHRhID8gdmVsb2NpdHkgOiAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgLT0gZGVsdGE7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVTY3JvbGxGb3JjZS5jYWxsKHRoaXMsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEsIGRlbHRhID8gdmVsb2NpdHkgOiAwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuY29tbWl0ID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0ID0gU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuY29tbWl0LmNhbGwodGhpcywgY29udGV4dCk7XG4gICAgaWYgKHRoaXMuX3B1bGxUb1JlZnJlc2gpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwdWxsVG9SZWZyZXNoID0gdGhpcy5fcHVsbFRvUmVmcmVzaFtpXTtcbiAgICAgICAgICAgIGlmIChwdWxsVG9SZWZyZXNoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHB1bGxUb1JlZnJlc2guc3RhdGUgPT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUgJiYgcHVsbFRvUmVmcmVzaC5wcmV2U3RhdGUgIT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgncmVmcmVzaCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvb3RlcjogcHVsbFRvUmVmcmVzaC5mb290ZXJcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHB1bGxUb1JlZnJlc2gucHJldlN0YXRlID0gcHVsbFRvUmVmcmVzaC5zdGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbm1vZHVsZS5leHBvcnRzID0gRmxleFNjcm9sbFZpZXc7IiwidmFyIE9wdGlvbnNNYW5hZ2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuT3B0aW9uc01hbmFnZXIgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5PcHRpb25zTWFuYWdlciA6IG51bGw7XG52YXIgVHJhbnNmb3JtID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogbnVsbDtcbnZhciBWZWN0b3IgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMubWF0aC5WZWN0b3IgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMubWF0aC5WZWN0b3IgOiBudWxsO1xudmFyIFBhcnRpY2xlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnBoeXNpY3MuYm9kaWVzLlBhcnRpY2xlIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnBoeXNpY3MuYm9kaWVzLlBhcnRpY2xlIDogbnVsbDtcbnZhciBTcHJpbmcgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMucGh5c2ljcy5mb3JjZXMuU3ByaW5nIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnBoeXNpY3MuZm9yY2VzLlNwcmluZyA6IG51bGw7XG52YXIgUGh5c2ljc0VuZ2luZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5waHlzaWNzLlBoeXNpY3NFbmdpbmUgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMucGh5c2ljcy5QaHlzaWNzRW5naW5lIDogbnVsbDtcbnZhciBMYXlvdXROb2RlID0gcmVxdWlyZSgnLi9MYXlvdXROb2RlJyk7XG52YXIgVHJhbnNpdGlvbmFibGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudHJhbnNpdGlvbnMuVHJhbnNpdGlvbmFibGUgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMudHJhbnNpdGlvbnMuVHJhbnNpdGlvbmFibGUgOiBudWxsO1xuZnVuY3Rpb24gRmxvd0xheW91dE5vZGUocmVuZGVyTm9kZSwgc3BlYykge1xuICAgIExheW91dE5vZGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAoIXRoaXMub3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuY3JlYXRlKHRoaXMuY29uc3RydWN0b3IuREVGQVVMVF9PUFRJT05TKTtcbiAgICAgICAgdGhpcy5fb3B0aW9uc01hbmFnZXIgPSBuZXcgT3B0aW9uc01hbmFnZXIodGhpcy5vcHRpb25zKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9wZSkge1xuICAgICAgICB0aGlzLl9wZSA9IG5ldyBQaHlzaWNzRW5naW5lKCk7XG4gICAgICAgIHRoaXMuX3BlLnNsZWVwKCk7XG4gICAgfVxuICAgIGlmICghdGhpcy5fcHJvcGVydGllcykge1xuICAgICAgICB0aGlzLl9wcm9wZXJ0aWVzID0ge307XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gdGhpcy5fcHJvcGVydGllcykge1xuICAgICAgICAgICAgdGhpcy5fcHJvcGVydGllc1twcm9wTmFtZV0uaW5pdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghdGhpcy5fbG9ja1RyYW5zaXRpb25hYmxlKSB7XG4gICAgICAgIHRoaXMuX2xvY2tUcmFuc2l0aW9uYWJsZSA9IG5ldyBUcmFuc2l0aW9uYWJsZSgxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9sb2NrVHJhbnNpdGlvbmFibGUuaGFsdCgpO1xuICAgICAgICB0aGlzLl9sb2NrVHJhbnNpdGlvbmFibGUucmVzZXQoMSk7XG4gICAgfVxuICAgIHRoaXMuX3NwZWNNb2RpZmllZCA9IHRydWU7XG4gICAgdGhpcy5faW5pdGlhbCA9IHRydWU7XG4gICAgaWYgKHNwZWMpIHtcbiAgICAgICAgdGhpcy5zZXRTcGVjKHNwZWMpO1xuICAgIH1cbn1cbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTGF5b3V0Tm9kZS5wcm90b3R5cGUpO1xuRmxvd0xheW91dE5vZGUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmxvd0xheW91dE5vZGU7XG5GbG93TGF5b3V0Tm9kZS5ERUZBVUxUX09QVElPTlMgPSB7XG4gICAgc3ByaW5nOiB7XG4gICAgICAgIGRhbXBpbmdSYXRpbzogMC44LFxuICAgICAgICBwZXJpb2Q6IDMwMFxuICAgIH0sXG4gICAgcGFydGljbGVSb3VuZGluZzogMC4wMDFcbn07XG52YXIgREVGQVVMVCA9IHtcbiAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgb3BhY2l0eTJEOiBbXG4gICAgICAgICAgICAxLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBzaXplOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBzY2FsZTogW1xuICAgICAgICAgICAgMSxcbiAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAxXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHJvdGF0ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHNrZXc6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdXG4gICAgfTtcbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB0aGlzLl9vcHRpb25zTWFuYWdlci5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgIHZhciB3YXNTbGVlcGluZyA9IHRoaXMuX3BlLmlzU2xlZXBpbmcoKTtcbiAgICBmb3IgKHZhciBwcm9wTmFtZSBpbiB0aGlzLl9wcm9wZXJ0aWVzKSB7XG4gICAgICAgIHZhciBwcm9wID0gdGhpcy5fcHJvcGVydGllc1twcm9wTmFtZV07XG4gICAgICAgIGlmIChwcm9wLmZvcmNlKSB7XG4gICAgICAgICAgICBwcm9wLmZvcmNlLnNldE9wdGlvbnMocHJvcC5mb3JjZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHdhc1NsZWVwaW5nKSB7XG4gICAgICAgIHRoaXMuX3BlLnNsZWVwKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZS5zZXRTcGVjID0gZnVuY3Rpb24gKHNwZWMpIHtcbiAgICB2YXIgc2V0O1xuICAgIGlmIChzcGVjLnRyYW5zZm9ybSkge1xuICAgICAgICBzZXQgPSBUcmFuc2Zvcm0uaW50ZXJwcmV0KHNwZWMudHJhbnNmb3JtKTtcbiAgICB9XG4gICAgaWYgKCFzZXQpIHtcbiAgICAgICAgc2V0ID0ge307XG4gICAgfVxuICAgIHNldC5vcGFjaXR5ID0gc3BlYy5vcGFjaXR5O1xuICAgIHNldC5zaXplID0gc3BlYy5zaXplO1xuICAgIHNldC5hbGlnbiA9IHNwZWMuYWxpZ247XG4gICAgc2V0Lm9yaWdpbiA9IHNwZWMub3JpZ2luO1xuICAgIHZhciBvbGRSZW1vdmluZyA9IHRoaXMuX3JlbW92aW5nO1xuICAgIHZhciBvbGRJbnZhbGlkYXRlZCA9IHRoaXMuX2ludmFsaWRhdGVkO1xuICAgIHRoaXMuc2V0KHNldCk7XG4gICAgdGhpcy5fcmVtb3ZpbmcgPSBvbGRSZW1vdmluZztcbiAgICB0aGlzLl9pbnZhbGlkYXRlZCA9IG9sZEludmFsaWRhdGVkO1xufTtcbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5faW52YWxpZGF0ZWQpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gdGhpcy5fcHJvcGVydGllcykge1xuICAgICAgICAgICAgdGhpcy5fcHJvcGVydGllc1twcm9wTmFtZV0uaW52YWxpZGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbnZhbGlkYXRlZCA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLnRydWVTaXplUmVxdWVzdGVkID0gZmFsc2U7XG4gICAgdGhpcy51c2VzVHJ1ZVNpemUgPSBmYWxzZTtcbn07XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKHJlbW92ZVNwZWMpIHtcbiAgICB0aGlzLl9yZW1vdmluZyA9IHRydWU7XG4gICAgaWYgKHJlbW92ZVNwZWMpIHtcbiAgICAgICAgdGhpcy5zZXRTcGVjKHJlbW92ZVNwZWMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3BlLnNsZWVwKCk7XG4gICAgICAgIHRoaXMuX3NwZWNNb2RpZmllZCA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLl9pbnZhbGlkYXRlZCA9IGZhbHNlO1xufTtcbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZS5yZWxlYXNlTG9jayA9IGZ1bmN0aW9uIChkdXJhdGlvbikge1xuICAgIHRoaXMuX2xvY2tUcmFuc2l0aW9uYWJsZS5oYWx0KCk7XG4gICAgdGhpcy5fbG9ja1RyYW5zaXRpb25hYmxlLnJlc2V0KDApO1xuICAgIHRoaXMuX2xvY2tUcmFuc2l0aW9uYWJsZS5zZXQoMSwgeyBkdXJhdGlvbjogZHVyYXRpb24gfHwgdGhpcy5vcHRpb25zLnNwcmluZy5wZXJpb2QgfHwgMTAwMCB9KTtcbn07XG5mdW5jdGlvbiBfZ2V0Um91bmRlZFZhbHVlM0QocHJvcCwgZGVmLCBwcmVjaXNpb24pIHtcbiAgICBpZiAoIXByb3AgfHwgIXByb3AuaW5pdCkge1xuICAgICAgICByZXR1cm4gZGVmO1xuICAgIH1cbiAgICBwcmVjaXNpb24gPSBwcmVjaXNpb24gfHwgdGhpcy5vcHRpb25zLnBhcnRpY2xlUm91bmRpbmc7XG4gICAgdmFyIHZhbHVlID0gcHJvcC5wYXJ0aWNsZS5nZXRQb3NpdGlvbigpO1xuICAgIHJldHVybiBbXG4gICAgICAgIE1hdGgucm91bmQodmFsdWVbMF0gLyBwcmVjaXNpb24pICogcHJlY2lzaW9uLFxuICAgICAgICBNYXRoLnJvdW5kKHZhbHVlWzFdIC8gcHJlY2lzaW9uKSAqIHByZWNpc2lvbixcbiAgICAgICAgTWF0aC5yb3VuZCh2YWx1ZVsyXSAvIHByZWNpc2lvbikgKiBwcmVjaXNpb25cbiAgICBdO1xufVxuRmxvd0xheW91dE5vZGUucHJvdG90eXBlLmdldFNwZWMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGVuZFN0YXRlUmVhY2hlZCA9IHRoaXMuX3BlLmlzU2xlZXBpbmcoKTtcbiAgICBpZiAoIXRoaXMuX3NwZWNNb2RpZmllZCAmJiBlbmRTdGF0ZVJlYWNoZWQpIHtcbiAgICAgICAgdGhpcy5fc3BlYy5yZW1vdmVkID0gIXRoaXMuX2ludmFsaWRhdGVkO1xuICAgICAgICByZXR1cm4gdGhpcy5fc3BlYztcbiAgICB9XG4gICAgdGhpcy5faW5pdGlhbCA9IGZhbHNlO1xuICAgIHRoaXMuX3NwZWNNb2RpZmllZCA9ICFlbmRTdGF0ZVJlYWNoZWQ7XG4gICAgdGhpcy5fc3BlYy5yZW1vdmVkID0gZmFsc2U7XG4gICAgaWYgKCFlbmRTdGF0ZVJlYWNoZWQpIHtcbiAgICAgICAgdGhpcy5fcGUuc3RlcCgpO1xuICAgIH1cbiAgICB2YXIgc3BlYyA9IHRoaXMuX3NwZWM7XG4gICAgdmFyIHByZWNpc2lvbiA9IHRoaXMub3B0aW9ucy5wYXJ0aWNsZVJvdW5kaW5nO1xuICAgIHZhciBsb2NrVmFsdWUgPSB0aGlzLl9sb2NrVHJhbnNpdGlvbmFibGUuZ2V0KCk7XG4gICAgdmFyIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLm9wYWNpdHk7XG4gICAgaWYgKHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIHNwZWMub3BhY2l0eSA9IE1hdGgucm91bmQoTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgcHJvcC5jdXJTdGF0ZS54KSkgLyBwcmVjaXNpb24pICogcHJlY2lzaW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMub3BhY2l0eSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMuc2l6ZTtcbiAgICBpZiAocHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgc3BlYy5zaXplID0gc3BlYy5zaXplIHx8IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF07XG4gICAgICAgIHNwZWMuc2l6ZVswXSA9IE1hdGgucm91bmQoKHByb3AuY3VyU3RhdGUueCArIChwcm9wLmVuZFN0YXRlLnggLSBwcm9wLmN1clN0YXRlLngpICogbG9ja1ZhbHVlKSAvIDAuMSkgKiAwLjE7XG4gICAgICAgIHNwZWMuc2l6ZVsxXSA9IE1hdGgucm91bmQoKHByb3AuY3VyU3RhdGUueSArIChwcm9wLmVuZFN0YXRlLnkgLSBwcm9wLmN1clN0YXRlLnkpICogbG9ja1ZhbHVlKSAvIDAuMSkgKiAwLjE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3BlYy5zaXplID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5hbGlnbjtcbiAgICBpZiAocHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgc3BlYy5hbGlnbiA9IHNwZWMuYWxpZ24gfHwgW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICAgICAgc3BlYy5hbGlnblswXSA9IE1hdGgucm91bmQoKHByb3AuY3VyU3RhdGUueCArIChwcm9wLmVuZFN0YXRlLnggLSBwcm9wLmN1clN0YXRlLngpICogbG9ja1ZhbHVlKSAvIDAuMSkgKiAwLjE7XG4gICAgICAgIHNwZWMuYWxpZ25bMV0gPSBNYXRoLnJvdW5kKChwcm9wLmN1clN0YXRlLnkgKyAocHJvcC5lbmRTdGF0ZS55IC0gcHJvcC5jdXJTdGF0ZS55KSAqIGxvY2tWYWx1ZSkgLyAwLjEpICogMC4xO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMuYWxpZ24gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLm9yaWdpbjtcbiAgICBpZiAocHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgc3BlYy5vcmlnaW4gPSBzcGVjLm9yaWdpbiB8fCBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdO1xuICAgICAgICBzcGVjLm9yaWdpblswXSA9IE1hdGgucm91bmQoKHByb3AuY3VyU3RhdGUueCArIChwcm9wLmVuZFN0YXRlLnggLSBwcm9wLmN1clN0YXRlLngpICogbG9ja1ZhbHVlKSAvIDAuMSkgKiAwLjE7XG4gICAgICAgIHNwZWMub3JpZ2luWzFdID0gTWF0aC5yb3VuZCgocHJvcC5jdXJTdGF0ZS55ICsgKHByb3AuZW5kU3RhdGUueSAtIHByb3AuY3VyU3RhdGUueSkgKiBsb2NrVmFsdWUpIC8gMC4xKSAqIDAuMTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzcGVjLm9yaWdpbiA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdmFyIHRyYW5zbGF0ZSA9IHRoaXMuX3Byb3BlcnRpZXMudHJhbnNsYXRlO1xuICAgIHZhciB0cmFuc2xhdGVYO1xuICAgIHZhciB0cmFuc2xhdGVZO1xuICAgIHZhciB0cmFuc2xhdGVaO1xuICAgIGlmICh0cmFuc2xhdGUgJiYgdHJhbnNsYXRlLmluaXQpIHtcbiAgICAgICAgdHJhbnNsYXRlWCA9IE1hdGgucm91bmQoKHRyYW5zbGF0ZS5jdXJTdGF0ZS54ICsgKHRyYW5zbGF0ZS5lbmRTdGF0ZS54IC0gdHJhbnNsYXRlLmN1clN0YXRlLngpICogbG9ja1ZhbHVlKSAvIHByZWNpc2lvbikgKiBwcmVjaXNpb247XG4gICAgICAgIHRyYW5zbGF0ZVkgPSBNYXRoLnJvdW5kKCh0cmFuc2xhdGUuY3VyU3RhdGUueSArICh0cmFuc2xhdGUuZW5kU3RhdGUueSAtIHRyYW5zbGF0ZS5jdXJTdGF0ZS55KSAqIGxvY2tWYWx1ZSkgLyBwcmVjaXNpb24pICogcHJlY2lzaW9uO1xuICAgICAgICB0cmFuc2xhdGVaID0gTWF0aC5yb3VuZCgodHJhbnNsYXRlLmN1clN0YXRlLnogKyAodHJhbnNsYXRlLmVuZFN0YXRlLnogLSB0cmFuc2xhdGUuY3VyU3RhdGUueikgKiBsb2NrVmFsdWUpIC8gcHJlY2lzaW9uKSAqIHByZWNpc2lvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0cmFuc2xhdGVYID0gMDtcbiAgICAgICAgdHJhbnNsYXRlWSA9IDA7XG4gICAgICAgIHRyYW5zbGF0ZVogPSAwO1xuICAgIH1cbiAgICB2YXIgc2NhbGUgPSB0aGlzLl9wcm9wZXJ0aWVzLnNjYWxlO1xuICAgIHZhciBza2V3ID0gdGhpcy5fcHJvcGVydGllcy5za2V3O1xuICAgIHZhciByb3RhdGUgPSB0aGlzLl9wcm9wZXJ0aWVzLnJvdGF0ZTtcbiAgICBpZiAoc2NhbGUgfHwgc2tldyB8fCByb3RhdGUpIHtcbiAgICAgICAgc3BlYy50cmFuc2Zvcm0gPSBUcmFuc2Zvcm0uYnVpbGQoe1xuICAgICAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAgICAgdHJhbnNsYXRlWCxcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGVZLFxuICAgICAgICAgICAgICAgIHRyYW5zbGF0ZVpcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBza2V3OiBfZ2V0Um91bmRlZFZhbHVlM0QuY2FsbCh0aGlzLCBza2V3LCBERUZBVUxULnNrZXcpLFxuICAgICAgICAgICAgc2NhbGU6IF9nZXRSb3VuZGVkVmFsdWUzRC5jYWxsKHRoaXMsIHNjYWxlLCBERUZBVUxULnNjYWxlKSxcbiAgICAgICAgICAgIHJvdGF0ZTogX2dldFJvdW5kZWRWYWx1ZTNELmNhbGwodGhpcywgcm90YXRlLCBERUZBVUxULnJvdGF0ZSlcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0cmFuc2xhdGUpIHtcbiAgICAgICAgaWYgKCFzcGVjLnRyYW5zZm9ybSkge1xuICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm0gPSBUcmFuc2Zvcm0udHJhbnNsYXRlKHRyYW5zbGF0ZVgsIHRyYW5zbGF0ZVksIHRyYW5zbGF0ZVopO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTJdID0gdHJhbnNsYXRlWDtcbiAgICAgICAgICAgIHNwZWMudHJhbnNmb3JtWzEzXSA9IHRyYW5zbGF0ZVk7XG4gICAgICAgICAgICBzcGVjLnRyYW5zZm9ybVsxNF0gPSB0cmFuc2xhdGVaO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3BlYy50cmFuc2Zvcm0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9zcGVjO1xufTtcbmZ1bmN0aW9uIF9zZXRQcm9wZXJ0eVZhbHVlKHByb3AsIHByb3BOYW1lLCBlbmRTdGF0ZSwgZGVmYXVsdFZhbHVlLCBpbW1lZGlhdGUsIGlzVHJhbnNsYXRlKSB7XG4gICAgcHJvcCA9IHByb3AgfHwgdGhpcy5fcHJvcGVydGllc1twcm9wTmFtZV07XG4gICAgaWYgKHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIHByb3AuaW52YWxpZGF0ZWQgPSB0cnVlO1xuICAgICAgICB2YXIgdmFsdWUgPSBkZWZhdWx0VmFsdWU7XG4gICAgICAgIGlmIChlbmRTdGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGVuZFN0YXRlO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3JlbW92aW5nKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHByb3AucGFydGljbGUuZ2V0UG9zaXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBwcm9wLmVuZFN0YXRlLnggPSB2YWx1ZVswXTtcbiAgICAgICAgcHJvcC5lbmRTdGF0ZS55ID0gdmFsdWUubGVuZ3RoID4gMSA/IHZhbHVlWzFdIDogMDtcbiAgICAgICAgcHJvcC5lbmRTdGF0ZS56ID0gdmFsdWUubGVuZ3RoID4gMiA/IHZhbHVlWzJdIDogMDtcbiAgICAgICAgaWYgKGltbWVkaWF0ZSkge1xuICAgICAgICAgICAgcHJvcC5jdXJTdGF0ZS54ID0gcHJvcC5lbmRTdGF0ZS54O1xuICAgICAgICAgICAgcHJvcC5jdXJTdGF0ZS55ID0gcHJvcC5lbmRTdGF0ZS55O1xuICAgICAgICAgICAgcHJvcC5jdXJTdGF0ZS56ID0gcHJvcC5lbmRTdGF0ZS56O1xuICAgICAgICAgICAgcHJvcC52ZWxvY2l0eS54ID0gMDtcbiAgICAgICAgICAgIHByb3AudmVsb2NpdHkueSA9IDA7XG4gICAgICAgICAgICBwcm9wLnZlbG9jaXR5LnogPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKHByb3AuZW5kU3RhdGUueCAhPT0gcHJvcC5jdXJTdGF0ZS54IHx8IHByb3AuZW5kU3RhdGUueSAhPT0gcHJvcC5jdXJTdGF0ZS55IHx8IHByb3AuZW5kU3RhdGUueiAhPT0gcHJvcC5jdXJTdGF0ZS56KSB7XG4gICAgICAgICAgICB0aGlzLl9wZS53YWtlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB3YXNTbGVlcGluZyA9IHRoaXMuX3BlLmlzU2xlZXBpbmcoKTtcbiAgICAgICAgaWYgKCFwcm9wKSB7XG4gICAgICAgICAgICBwcm9wID0ge1xuICAgICAgICAgICAgICAgIHBhcnRpY2xlOiBuZXcgUGFydGljbGUoeyBwb3NpdGlvbjogdGhpcy5faW5pdGlhbCB8fCBpbW1lZGlhdGUgPyBlbmRTdGF0ZSA6IGRlZmF1bHRWYWx1ZSB9KSxcbiAgICAgICAgICAgICAgICBlbmRTdGF0ZTogbmV3IFZlY3RvcihlbmRTdGF0ZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBwcm9wLmN1clN0YXRlID0gcHJvcC5wYXJ0aWNsZS5wb3NpdGlvbjtcbiAgICAgICAgICAgIHByb3AudmVsb2NpdHkgPSBwcm9wLnBhcnRpY2xlLnZlbG9jaXR5O1xuICAgICAgICAgICAgcHJvcC5mb3JjZSA9IG5ldyBTcHJpbmcodGhpcy5vcHRpb25zLnNwcmluZyk7XG4gICAgICAgICAgICBwcm9wLmZvcmNlLnNldE9wdGlvbnMoeyBhbmNob3I6IHByb3AuZW5kU3RhdGUgfSk7XG4gICAgICAgICAgICB0aGlzLl9wZS5hZGRCb2R5KHByb3AucGFydGljbGUpO1xuICAgICAgICAgICAgcHJvcC5mb3JjZUlkID0gdGhpcy5fcGUuYXR0YWNoKHByb3AuZm9yY2UsIHByb3AucGFydGljbGUpO1xuICAgICAgICAgICAgdGhpcy5fcHJvcGVydGllc1twcm9wTmFtZV0gPSBwcm9wO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvcC5wYXJ0aWNsZS5zZXRQb3NpdGlvbih0aGlzLl9pbml0aWFsIHx8IGltbWVkaWF0ZSA/IGVuZFN0YXRlIDogZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgICAgIHByb3AuZW5kU3RhdGUuc2V0KGVuZFN0YXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2luaXRpYWwgJiYgIWltbWVkaWF0ZSkge1xuICAgICAgICAgICAgdGhpcy5fcGUud2FrZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKHdhc1NsZWVwaW5nKSB7XG4gICAgICAgICAgICB0aGlzLl9wZS5zbGVlcCgpO1xuICAgICAgICB9XG4gICAgICAgIHByb3AuaW5pdCA9IHRydWU7XG4gICAgICAgIHByb3AuaW52YWxpZGF0ZWQgPSB0cnVlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIF9nZXRJZk5FMkQoYTEsIGEyKSB7XG4gICAgcmV0dXJuIGExWzBdID09PSBhMlswXSAmJiBhMVsxXSA9PT0gYTJbMV0gPyB1bmRlZmluZWQgOiBhMTtcbn1cbmZ1bmN0aW9uIF9nZXRJZk5FM0QoYTEsIGEyKSB7XG4gICAgcmV0dXJuIGExWzBdID09PSBhMlswXSAmJiBhMVsxXSA9PT0gYTJbMV0gJiYgYTFbMl0gPT09IGEyWzJdID8gdW5kZWZpbmVkIDogYTE7XG59XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHNldCwgZGVmYXVsdFNpemUpIHtcbiAgICBpZiAoZGVmYXVsdFNpemUpIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZpbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5faW52YWxpZGF0ZWQgPSB0cnVlO1xuICAgIHRoaXMuc2Nyb2xsTGVuZ3RoID0gc2V0LnNjcm9sbExlbmd0aDtcbiAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSB0cnVlO1xuICAgIHZhciBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5vcGFjaXR5O1xuICAgIHZhciB2YWx1ZSA9IHNldC5vcGFjaXR5ID09PSBERUZBVUxULm9wYWNpdHkgPyB1bmRlZmluZWQgOiBzZXQub3BhY2l0eTtcbiAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCB8fCBwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBfc2V0UHJvcGVydHlWYWx1ZS5jYWxsKHRoaXMsIHByb3AsICdvcGFjaXR5JywgdmFsdWUgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IFtcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLCBERUZBVUxULm9wYWNpdHkyRCk7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLmFsaWduO1xuICAgIHZhbHVlID0gc2V0LmFsaWduID8gX2dldElmTkUyRChzZXQuYWxpZ24sIERFRkFVTFQuYWxpZ24pIDogdW5kZWZpbmVkO1xuICAgIGlmICh2YWx1ZSB8fCBwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBfc2V0UHJvcGVydHlWYWx1ZS5jYWxsKHRoaXMsIHByb3AsICdhbGlnbicsIHZhbHVlLCBERUZBVUxULmFsaWduKTtcbiAgICB9XG4gICAgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMub3JpZ2luO1xuICAgIHZhbHVlID0gc2V0Lm9yaWdpbiA/IF9nZXRJZk5FMkQoc2V0Lm9yaWdpbiwgREVGQVVMVC5vcmlnaW4pIDogdW5kZWZpbmVkO1xuICAgIGlmICh2YWx1ZSB8fCBwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBfc2V0UHJvcGVydHlWYWx1ZS5jYWxsKHRoaXMsIHByb3AsICdvcmlnaW4nLCB2YWx1ZSwgREVGQVVMVC5vcmlnaW4pO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5zaXplO1xuICAgIHZhbHVlID0gc2V0LnNpemUgfHwgZGVmYXVsdFNpemU7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3NpemUnLCB2YWx1ZSwgZGVmYXVsdFNpemUsIHRoaXMudXNlc1RydWVTaXplKTtcbiAgICB9XG4gICAgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMudHJhbnNsYXRlO1xuICAgIHZhbHVlID0gc2V0LnRyYW5zbGF0ZTtcbiAgICBpZiAodmFsdWUgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAndHJhbnNsYXRlJywgdmFsdWUsIERFRkFVTFQudHJhbnNsYXRlLCB1bmRlZmluZWQsIHRydWUpO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5zY2FsZTtcbiAgICB2YWx1ZSA9IHNldC5zY2FsZSA/IF9nZXRJZk5FM0Qoc2V0LnNjYWxlLCBERUZBVUxULnNjYWxlKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodmFsdWUgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAnc2NhbGUnLCB2YWx1ZSwgREVGQVVMVC5zY2FsZSk7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLnJvdGF0ZTtcbiAgICB2YWx1ZSA9IHNldC5yb3RhdGUgPyBfZ2V0SWZORTNEKHNldC5yb3RhdGUsIERFRkFVTFQucm90YXRlKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodmFsdWUgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAncm90YXRlJywgdmFsdWUsIERFRkFVTFQucm90YXRlKTtcbiAgICB9XG4gICAgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMuc2tldztcbiAgICB2YWx1ZSA9IHNldC5za2V3ID8gX2dldElmTkUzRChzZXQuc2tldywgREVGQVVMVC5za2V3KSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodmFsdWUgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAnc2tldycsIHZhbHVlLCBERUZBVUxULnNrZXcpO1xuICAgIH1cbn07XG5tb2R1bGUuZXhwb3J0cyA9IEZsb3dMYXlvdXROb2RlOyIsImZ1bmN0aW9uIExheW91dENvbnRleHQobWV0aG9kcykge1xuICAgIGZvciAodmFyIG4gaW4gbWV0aG9kcykge1xuICAgICAgICB0aGlzW25dID0gbWV0aG9kc1tuXTtcbiAgICB9XG59XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5zaXplID0gdW5kZWZpbmVkO1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuZGlyZWN0aW9uID0gdW5kZWZpbmVkO1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuc2Nyb2xsT2Zmc2V0ID0gdW5kZWZpbmVkO1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuc2Nyb2xsU3RhcnQgPSB1bmRlZmluZWQ7XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5zY3JvbGxFbmQgPSB1bmRlZmluZWQ7XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xufTtcbkxheW91dENvbnRleHQucHJvdG90eXBlLnByZXYgPSBmdW5jdGlvbiAoKSB7XG59O1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKG5vZGUpIHtcbn07XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAobm9kZSwgc2V0KSB7XG59O1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUucmVzb2x2ZVNpemUgPSBmdW5jdGlvbiAobm9kZSkge1xufTtcbm1vZHVsZS5leHBvcnRzID0gTGF5b3V0Q29udGV4dDsiLCJ2YXIgVXRpbGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IG51bGw7XG52YXIgRW50aXR5ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuRW50aXR5IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuRW50aXR5IDogbnVsbDtcbnZhciBWaWV3U2VxdWVuY2UgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuY29yZS5WaWV3U2VxdWVuY2UgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5WaWV3U2VxdWVuY2UgOiBudWxsO1xudmFyIE9wdGlvbnNNYW5hZ2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuT3B0aW9uc01hbmFnZXIgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5PcHRpb25zTWFuYWdlciA6IG51bGw7XG52YXIgRXZlbnRIYW5kbGVyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuRXZlbnRIYW5kbGVyIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuRXZlbnRIYW5kbGVyIDogbnVsbDtcbnZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgTGF5b3V0Tm9kZU1hbmFnZXIgPSByZXF1aXJlKCcuL0xheW91dE5vZGVNYW5hZ2VyJyk7XG52YXIgTGF5b3V0Tm9kZSA9IHJlcXVpcmUoJy4vTGF5b3V0Tm9kZScpO1xudmFyIEZsb3dMYXlvdXROb2RlID0gcmVxdWlyZSgnLi9GbG93TGF5b3V0Tm9kZScpO1xudmFyIFRyYW5zZm9ybSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IG51bGw7XG5yZXF1aXJlKCcuL2hlbHBlcnMvTGF5b3V0RG9ja0hlbHBlcicpO1xuZnVuY3Rpb24gTGF5b3V0Q29udHJvbGxlcihvcHRpb25zLCBub2RlTWFuYWdlcikge1xuICAgIHRoaXMuaWQgPSBFbnRpdHkucmVnaXN0ZXIodGhpcyk7XG4gICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fY29udGV4dFNpemVDYWNoZSA9IFtcbiAgICAgICAgMCxcbiAgICAgICAgMFxuICAgIF07XG4gICAgdGhpcy5fY29tbWl0T3V0cHV0ID0ge307XG4gICAgdGhpcy5fZXZlbnRJbnB1dCA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbiAgICBFdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKHRoaXMsIHRoaXMuX2V2ZW50SW5wdXQpO1xuICAgIHRoaXMuX2V2ZW50T3V0cHV0ID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuICAgIEV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKHRoaXMsIHRoaXMuX2V2ZW50T3V0cHV0KTtcbiAgICB0aGlzLl9sYXlvdXQgPSB7IG9wdGlvbnM6IE9iamVjdC5jcmVhdGUoe30pIH07XG4gICAgdGhpcy5fbGF5b3V0Lm9wdGlvbnNNYW5hZ2VyID0gbmV3IE9wdGlvbnNNYW5hZ2VyKHRoaXMuX2xheW91dC5vcHRpb25zKTtcbiAgICB0aGlzLl9sYXlvdXQub3B0aW9uc01hbmFnZXIub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuY3JlYXRlKExheW91dENvbnRyb2xsZXIuREVGQVVMVF9PUFRJT05TKTtcbiAgICB0aGlzLl9vcHRpb25zTWFuYWdlciA9IG5ldyBPcHRpb25zTWFuYWdlcih0aGlzLm9wdGlvbnMpO1xuICAgIGlmIChub2RlTWFuYWdlcikge1xuICAgICAgICB0aGlzLl9ub2RlcyA9IG5vZGVNYW5hZ2VyO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmZsb3cpIHtcbiAgICAgICAgdGhpcy5fbm9kZXMgPSBuZXcgTGF5b3V0Tm9kZU1hbmFnZXIoRmxvd0xheW91dE5vZGUsIF9pbml0Rmxvd0xheW91dE5vZGUuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbm9kZXMgPSBuZXcgTGF5b3V0Tm9kZU1hbmFnZXIoTGF5b3V0Tm9kZSk7XG4gICAgfVxuICAgIHRoaXMuc2V0RGlyZWN0aW9uKHVuZGVmaW5lZCk7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgIH1cbn1cbkxheW91dENvbnRyb2xsZXIuREVGQVVMVF9PUFRJT05TID0ge1xuICAgIG5vZGVTcHJpbmc6IHtcbiAgICAgICAgZGFtcGluZ1JhdGlvOiAwLjgsXG4gICAgICAgIHBlcmlvZDogMzAwXG4gICAgfSxcbiAgICByZWZsb3dPblJlc2l6ZTogdHJ1ZVxufTtcbmZ1bmN0aW9uIF9pbml0Rmxvd0xheW91dE5vZGUobm9kZSwgc3BlYykge1xuICAgIGlmICghc3BlYyAmJiB0aGlzLm9wdGlvbnMuaW5zZXJ0U3BlYykge1xuICAgICAgICBub2RlLnNldFNwZWModGhpcy5vcHRpb25zLmluc2VydFNwZWMpO1xuICAgIH1cbn1cbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiBzZXRPcHRpb25zKG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5hbGlnbm1lbnQgIT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLmFsaWdubWVudCAhPT0gdGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5fb3B0aW9uc01hbmFnZXIuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICBpZiAob3B0aW9ucy5kYXRhU291cmNlKSB7XG4gICAgICAgIHRoaXMuc2V0RGF0YVNvdXJjZShvcHRpb25zLmRhdGFTb3VyY2UpO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5sYXlvdXQgfHwgb3B0aW9ucy5sYXlvdXRPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuc2V0TGF5b3V0KG9wdGlvbnMubGF5b3V0LCBvcHRpb25zLmxheW91dE9wdGlvbnMpO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5kaXJlY3Rpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLnNldERpcmVjdGlvbihvcHRpb25zLmRpcmVjdGlvbik7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLm5vZGVTcHJpbmcgJiYgdGhpcy5vcHRpb25zLmZsb3cpIHtcbiAgICAgICAgdGhpcy5fbm9kZXMuc2V0Tm9kZU9wdGlvbnMoeyBzcHJpbmc6IG9wdGlvbnMubm9kZVNwcmluZyB9KTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMucHJlYWxsb2NhdGVOb2Rlcykge1xuICAgICAgICB0aGlzLl9ub2Rlcy5wcmVhbGxvY2F0ZU5vZGVzKG9wdGlvbnMucHJlYWxsb2NhdGVOb2Rlcy5jb3VudCB8fCAwLCBvcHRpb25zLnByZWFsbG9jYXRlTm9kZXMuc3BlYyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbmZ1bmN0aW9uIF9mb3JFYWNoUmVuZGVyYWJsZShjYWxsYmFjaykge1xuICAgIHZhciBkYXRhU291cmNlID0gdGhpcy5fZGF0YVNvdXJjZTtcbiAgICBpZiAoZGF0YVNvdXJjZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gZGF0YVNvdXJjZS5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGFTb3VyY2VbaV0pO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChkYXRhU291cmNlIGluc3RhbmNlb2YgVmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHZhciByZW5kZXJhYmxlO1xuICAgICAgICB3aGlsZSAoZGF0YVNvdXJjZSkge1xuICAgICAgICAgICAgcmVuZGVyYWJsZSA9IGRhdGFTb3VyY2UuZ2V0KCk7XG4gICAgICAgICAgICBpZiAoIXJlbmRlcmFibGUpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrKHJlbmRlcmFibGUpO1xuICAgICAgICAgICAgZGF0YVNvdXJjZSA9IGRhdGFTb3VyY2UuZ2V0TmV4dCgpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGFTb3VyY2UpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGFTb3VyY2Vba2V5XSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5zZXREYXRhU291cmNlID0gZnVuY3Rpb24gKGRhdGFTb3VyY2UpIHtcbiAgICB0aGlzLl9kYXRhU291cmNlID0gZGF0YVNvdXJjZTtcbiAgICB0aGlzLl9ub2Rlc0J5SWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGRhdGFTb3VyY2UgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSBuZXcgVmlld1NlcXVlbmNlKGRhdGFTb3VyY2UpO1xuICAgIH0gZWxzZSBpZiAoZGF0YVNvdXJjZSBpbnN0YW5jZW9mIFZpZXdTZXF1ZW5jZSkge1xuICAgICAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSBkYXRhU291cmNlO1xuICAgIH0gZWxzZSBpZiAoZGF0YVNvdXJjZSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICB0aGlzLl9ub2Rlc0J5SWQgPSBkYXRhU291cmNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9QaXBlRXZlbnRzKSB7XG4gICAgICAgIF9mb3JFYWNoUmVuZGVyYWJsZS5jYWxsKHRoaXMsIGZ1bmN0aW9uIChyZW5kZXJhYmxlKSB7XG4gICAgICAgICAgICBpZiAocmVuZGVyYWJsZSAmJiByZW5kZXJhYmxlLnBpcGUpIHtcbiAgICAgICAgICAgICAgICByZW5kZXJhYmxlLnBpcGUodGhpcyk7XG4gICAgICAgICAgICAgICAgcmVuZGVyYWJsZS5waXBlKHRoaXMuX2V2ZW50T3V0cHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG4gICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuZ2V0RGF0YVNvdXJjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGF0YVNvdXJjZTtcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5zZXRMYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0LCBvcHRpb25zKSB7XG4gICAgaWYgKGxheW91dCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2xheW91dC5fZnVuY3Rpb24gPSBsYXlvdXQ7XG4gICAgICAgIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMgPSBsYXlvdXQuQ2FwYWJpbGl0aWVzO1xuICAgICAgICB0aGlzLl9sYXlvdXQubGl0ZXJhbCA9IHVuZGVmaW5lZDtcbiAgICB9IGVsc2UgaWYgKGxheW91dCBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICB0aGlzLl9sYXlvdXQubGl0ZXJhbCA9IGxheW91dDtcbiAgICAgICAgdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgdmFyIGhlbHBlck5hbWUgPSBPYmplY3Qua2V5cyhsYXlvdXQpWzBdO1xuICAgICAgICB2YXIgSGVscGVyID0gTGF5b3V0VXRpbGl0eS5nZXRSZWdpc3RlcmVkSGVscGVyKGhlbHBlck5hbWUpO1xuICAgICAgICB0aGlzLl9sYXlvdXQuX2Z1bmN0aW9uID0gSGVscGVyID8gZnVuY3Rpb24gKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBoZWxwZXIgPSBuZXcgSGVscGVyKGNvbnRleHQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaGVscGVyLnBhcnNlKGxheW91dFtoZWxwZXJOYW1lXSk7XG4gICAgICAgIH0gOiB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbGF5b3V0Ll9mdW5jdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fbGF5b3V0LmxpdGVyYWwgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuc2V0TGF5b3V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICB9XG4gICAgdGhpcy5zZXREaXJlY3Rpb24odGhpcy5fY29uZmlndXJlZERpcmVjdGlvbik7XG4gICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuZ2V0TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9sYXlvdXQubGl0ZXJhbCB8fCB0aGlzLl9sYXlvdXQuX2Z1bmN0aW9uO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnNldExheW91dE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHRoaXMuX2xheW91dC5vcHRpb25zTWFuYWdlci5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmdldExheW91dE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2xheW91dC5vcHRpb25zO1xufTtcbmZ1bmN0aW9uIF9nZXRBY3R1YWxEaXJlY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgaWYgKHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMgJiYgdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcy5kaXJlY3Rpb24pIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcy5kaXJlY3Rpb24pKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuZGlyZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuZGlyZWN0aW9uW2ldID09PSBkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcy5kaXJlY3Rpb25bMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcy5kaXJlY3Rpb247XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gdW5kZWZpbmVkID8gVXRpbGl0eS5EaXJlY3Rpb24uWSA6IGRpcmVjdGlvbjtcbn1cbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnNldERpcmVjdGlvbiA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcbiAgICB0aGlzLl9jb25maWd1cmVkRGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgIHZhciBuZXdEaXJlY3Rpb24gPSBfZ2V0QWN0dWFsRGlyZWN0aW9uLmNhbGwodGhpcywgZGlyZWN0aW9uKTtcbiAgICBpZiAobmV3RGlyZWN0aW9uICE9PSB0aGlzLl9kaXJlY3Rpb24pIHtcbiAgICAgICAgdGhpcy5fZGlyZWN0aW9uID0gbmV3RGlyZWN0aW9uO1xuICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICB9XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuZ2V0RGlyZWN0aW9uID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgIHJldHVybiBhY3R1YWwgPyB0aGlzLl9kaXJlY3Rpb24gOiB0aGlzLl9jb25maWd1cmVkRGlyZWN0aW9uO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmdldFNwZWMgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIGlmICghbm9kZSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2Ygbm9kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9ub2Rlc0J5SWQpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IHRoaXMuX25vZGVzQnlJZFtub2RlXTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLl9zcGVjcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3NwZWNzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc3BlYyA9IHRoaXMuX3NwZWNzW2ldO1xuICAgICAgICAgICAgaWYgKHNwZWMucmVuZGVyTm9kZSA9PT0gbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzcGVjO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUucmVmbG93TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uIChpbmRleE9ySWQsIHJlbmRlcmFibGUsIGluc2VydFNwZWMpIHtcbiAgICBpZiAoaW5kZXhPcklkIGluc3RhbmNlb2YgU3RyaW5nIHx8IHR5cGVvZiBpbmRleE9ySWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmICh0aGlzLl9kYXRhU291cmNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2RhdGFTb3VyY2UgPSB7fTtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzQnlJZCA9IHRoaXMuX2RhdGFTb3VyY2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbm9kZXNCeUlkW2luZGV4T3JJZF0gPSByZW5kZXJhYmxlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLl9kYXRhU291cmNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2RhdGFTb3VyY2UgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3ZpZXdTZXF1ZW5jZSA9IG5ldyBWaWV3U2VxdWVuY2UodGhpcy5fZGF0YVNvdXJjZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGFTb3VyY2UgPSB0aGlzLl92aWV3U2VxdWVuY2UgfHwgdGhpcy5fZGF0YVNvdXJjZTtcbiAgICAgICAgaWYgKGluZGV4T3JJZCA9PT0gLTEpIHtcbiAgICAgICAgICAgIGRhdGFTb3VyY2UucHVzaChyZW5kZXJhYmxlKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbmRleE9ySWQgPT09IDApIHtcbiAgICAgICAgICAgIGlmIChkYXRhU291cmNlID09PSB0aGlzLl92aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlLnNwbGljZSgwLCAwLCByZW5kZXJhYmxlKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdmlld1NlcXVlbmNlLmdldEluZGV4KCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRWaWV3U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFZpZXdTZXF1ZW5jZSAmJiBuZXh0Vmlld1NlcXVlbmNlLmdldCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSBuZXh0Vmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlLnNwbGljZSgwLCAwLCByZW5kZXJhYmxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGFTb3VyY2Uuc3BsaWNlKGluZGV4T3JJZCwgMCwgcmVuZGVyYWJsZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGluc2VydFNwZWMpIHtcbiAgICAgICAgdGhpcy5fbm9kZXMuaW5zZXJ0Tm9kZSh0aGlzLl9ub2Rlcy5jcmVhdGVOb2RlKHJlbmRlcmFibGUsIGluc2VydFNwZWMpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvUGlwZUV2ZW50cyAmJiByZW5kZXJhYmxlICYmIHJlbmRlcmFibGUucGlwZSkge1xuICAgICAgICByZW5kZXJhYmxlLnBpcGUodGhpcyk7XG4gICAgICAgIHJlbmRlcmFibGUucGlwZSh0aGlzLl9ldmVudE91dHB1dCk7XG4gICAgfVxuICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAocmVuZGVyYWJsZSwgaW5zZXJ0U3BlYykge1xuICAgIHJldHVybiB0aGlzLmluc2VydCgtMSwgcmVuZGVyYWJsZSwgaW5zZXJ0U3BlYyk7XG59O1xuZnVuY3Rpb24gX2dldFZpZXdTZXF1ZW5jZUF0SW5kZXgoaW5kZXgpIHtcbiAgICB2YXIgdmlld1NlcXVlbmNlID0gdGhpcy5fdmlld1NlcXVlbmNlO1xuICAgIHZhciBpID0gdmlld1NlcXVlbmNlID8gdmlld1NlcXVlbmNlLmdldEluZGV4KCkgOiBpbmRleDtcbiAgICBpZiAoaW5kZXggPiBpKSB7XG4gICAgICAgIHdoaWxlICh2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgICAgICAgICBpZiAoIXZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpID0gdmlld1NlcXVlbmNlLmdldEluZGV4KCk7XG4gICAgICAgICAgICBpZiAoaSA9PT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpbmRleCA8IGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChpbmRleCA8IGkpIHtcbiAgICAgICAgd2hpbGUgKHZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgdmlld1NlcXVlbmNlID0gdmlld1NlcXVlbmNlLmdldFByZXZpb3VzKCk7XG4gICAgICAgICAgICBpZiAoIXZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpID0gdmlld1NlcXVlbmNlLmdldEluZGV4KCk7XG4gICAgICAgICAgICBpZiAoaSA9PT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpbmRleCA+IGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2aWV3U2VxdWVuY2U7XG59XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5zd2FwID0gZnVuY3Rpb24gKGluZGV4LCBpbmRleDIpIHtcbiAgICBpZiAodGhpcy5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgIF9nZXRWaWV3U2VxdWVuY2VBdEluZGV4LmNhbGwodGhpcywgaW5kZXgpLnN3YXAoX2dldFZpZXdTZXF1ZW5jZUF0SW5kZXguY2FsbCh0aGlzLCBpbmRleDIpKTtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChpbmRleE9ySWQsIHJlbW92ZVNwZWMpIHtcbiAgICB2YXIgcmVuZGVyTm9kZTtcbiAgICBpZiAodGhpcy5fbm9kZXNCeUlkIHx8IGluZGV4T3JJZCBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2YgaW5kZXhPcklkID09PSAnc3RyaW5nJykge1xuICAgICAgICByZW5kZXJOb2RlID0gdGhpcy5fbm9kZXNCeUlkW2luZGV4T3JJZF07XG4gICAgICAgIGlmIChyZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fbm9kZXNCeUlkW2luZGV4T3JJZF07XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICByZW5kZXJOb2RlID0gdGhpcy5fZGF0YVNvdXJjZS5zcGxpY2UoaW5kZXhPcklkLCAxKVswXTtcbiAgICB9XG4gICAgaWYgKHJlbmRlck5vZGUgJiYgcmVtb3ZlU3BlYykge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuX25vZGVzLmdldE5vZGVCeVJlbmRlck5vZGUocmVuZGVyTm9kZSk7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZShyZW1vdmVTcGVjIHx8IHRoaXMub3B0aW9ucy5yZW1vdmVTcGVjKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAocmVuZGVyTm9kZSkge1xuICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUucmVtb3ZlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9ub2Rlc0J5SWQpIHtcbiAgICAgICAgdmFyIGRpcnR5ID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9ub2Rlc0J5SWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ub2Rlc0J5SWRba2V5XTtcbiAgICAgICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGlydHkpIHtcbiAgICAgICAgICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLl9kYXRhU291cmNlKSB7XG4gICAgICAgIHRoaXMuc2V0RGF0YVNvdXJjZShbXSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmdldFNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NpemUgfHwgdGhpcy5vcHRpb25zLnNpemU7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmNvbW1pdCA9IGZ1bmN0aW9uIGNvbW1pdChjb250ZXh0KSB7XG4gICAgdmFyIHRyYW5zZm9ybSA9IGNvbnRleHQudHJhbnNmb3JtO1xuICAgIHZhciBvcmlnaW4gPSBjb250ZXh0Lm9yaWdpbjtcbiAgICB2YXIgc2l6ZSA9IGNvbnRleHQuc2l6ZTtcbiAgICB2YXIgb3BhY2l0eSA9IGNvbnRleHQub3BhY2l0eTtcbiAgICBpZiAoc2l6ZVswXSAhPT0gdGhpcy5fY29udGV4dFNpemVDYWNoZVswXSB8fCBzaXplWzFdICE9PSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzFdIHx8IHRoaXMuX2lzRGlydHkgfHwgdGhpcy5fbm9kZXMuX3RydWVTaXplUmVxdWVzdGVkIHx8IHRoaXMub3B0aW9ucy5hbHdheXNMYXlvdXQpIHtcbiAgICAgICAgdmFyIGV2ZW50RGF0YSA9IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHRoaXMsXG4gICAgICAgICAgICAgICAgb2xkU2l6ZTogdGhpcy5fY29udGV4dFNpemVDYWNoZSxcbiAgICAgICAgICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICAgICAgICAgIGRpcnR5OiB0aGlzLl9pc0RpcnR5LFxuICAgICAgICAgICAgICAgIHRydWVTaXplUmVxdWVzdGVkOiB0aGlzLl9ub2Rlcy5fdHJ1ZVNpemVSZXF1ZXN0ZWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ2xheW91dHN0YXJ0JywgZXZlbnREYXRhKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5mbG93ICYmICh0aGlzLl9pc0RpcnR5IHx8IHRoaXMub3B0aW9ucy5yZWZsb3dPblJlc2l6ZSAmJiAoc2l6ZVswXSAhPT0gdGhpcy5fY29udGV4dFNpemVDYWNoZVswXSB8fCBzaXplWzFdICE9PSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzFdKSkpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSgpO1xuICAgICAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBub2RlLnJlbGVhc2VMb2NrKCk7XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29udGV4dFNpemVDYWNoZVswXSA9IHNpemVbMF07XG4gICAgICAgIHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMV0gPSBzaXplWzFdO1xuICAgICAgICB0aGlzLl9pc0RpcnR5ID0gZmFsc2U7XG4gICAgICAgIHZhciBzY3JvbGxFbmQ7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2l6ZSAmJiB0aGlzLm9wdGlvbnMuc2l6ZVt0aGlzLl9kaXJlY3Rpb25dID09PSB0cnVlKSB7XG4gICAgICAgICAgICBzY3JvbGxFbmQgPSAxMDAwMDAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsYXlvdXRDb250ZXh0ID0gdGhpcy5fbm9kZXMucHJlcGFyZUZvckxheW91dCh0aGlzLl92aWV3U2VxdWVuY2UsIHRoaXMuX25vZGVzQnlJZCwge1xuICAgICAgICAgICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLl9kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgc2Nyb2xsRW5kOiBzY3JvbGxFbmRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5fbGF5b3V0Ll9mdW5jdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fbGF5b3V0Ll9mdW5jdGlvbihsYXlvdXRDb250ZXh0LCB0aGlzLl9sYXlvdXQub3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjcm9sbEVuZCkge1xuICAgICAgICAgICAgc2Nyb2xsRW5kID0gMDtcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKCk7XG4gICAgICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlLl9pbnZhbGlkYXRlZCAmJiBub2RlLnNjcm9sbExlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxFbmQgKz0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2l6ZSA9IHRoaXMuX3NpemUgfHwgW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHRoaXMuX3NpemVbMF0gPSB0aGlzLm9wdGlvbnMuc2l6ZVswXTtcbiAgICAgICAgICAgIHRoaXMuX3NpemVbMV0gPSB0aGlzLm9wdGlvbnMuc2l6ZVsxXTtcbiAgICAgICAgICAgIHRoaXMuX3NpemVbdGhpcy5fZGlyZWN0aW9uXSA9IHNjcm9sbEVuZDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5fbm9kZXMuYnVpbGRTcGVjQW5kRGVzdHJveVVucmVuZGVyZWROb2RlcygpO1xuICAgICAgICB0aGlzLl9jb21taXRPdXRwdXQudGFyZ2V0ID0gcmVzdWx0LnNwZWNzO1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdyZWZsb3cnLCB7IHRhcmdldDogdGhpcyB9KTtcbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgnbGF5b3V0ZW5kJywgZXZlbnREYXRhKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5mbG93KSB7XG4gICAgICAgIHJlc3VsdCA9IHRoaXMuX25vZGVzLmJ1aWxkU3BlY0FuZERlc3Ryb3lVbnJlbmRlcmVkTm9kZXMoKTtcbiAgICAgICAgdGhpcy5fY29tbWl0T3V0cHV0LnRhcmdldCA9IHJlc3VsdC5zcGVjcztcbiAgICAgICAgaWYgKHJlc3VsdC5tb2RpZmllZCkge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgncmVmbG93JywgeyB0YXJnZXQ6IHRoaXMgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fc3BlY3MgPSB0aGlzLl9jb21taXRPdXRwdXQudGFyZ2V0O1xuICAgIHZhciB0YXJnZXQgPSB0aGlzLl9jb21taXRPdXRwdXQudGFyZ2V0O1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gdGFyZ2V0Lmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICB0YXJnZXRbaV0udGFyZ2V0ID0gdGFyZ2V0W2ldLnJlbmRlck5vZGUucmVuZGVyKCk7XG4gICAgfVxuICAgIGlmIChvcmlnaW4gJiYgKG9yaWdpblswXSAhPT0gMCB8fCBvcmlnaW5bMV0gIT09IDApKSB7XG4gICAgICAgIHRyYW5zZm9ybSA9IFRyYW5zZm9ybS5tb3ZlVGhlbihbXG4gICAgICAgICAgICAtc2l6ZVswXSAqIG9yaWdpblswXSxcbiAgICAgICAgICAgIC1zaXplWzFdICogb3JpZ2luWzFdLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLCB0cmFuc2Zvcm0pO1xuICAgIH1cbiAgICB0aGlzLl9jb21taXRPdXRwdXQuc2l6ZSA9IHNpemU7XG4gICAgdGhpcy5fY29tbWl0T3V0cHV0Lm9wYWNpdHkgPSBvcGFjaXR5O1xuICAgIHRoaXMuX2NvbW1pdE91dHB1dC50cmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgcmV0dXJuIHRoaXMuX2NvbW1pdE91dHB1dDtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IExheW91dENvbnRyb2xsZXI7IiwidmFyIFRyYW5zZm9ybSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IG51bGw7XG52YXIgTGF5b3V0VXRpbGl0eSA9IHJlcXVpcmUoJy4vTGF5b3V0VXRpbGl0eScpO1xuZnVuY3Rpb24gTGF5b3V0Tm9kZShyZW5kZXJOb2RlLCBzcGVjKSB7XG4gICAgdGhpcy5yZW5kZXJOb2RlID0gcmVuZGVyTm9kZTtcbiAgICB0aGlzLl9zcGVjID0gc3BlYyA/IExheW91dFV0aWxpdHkuY2xvbmVTcGVjKHNwZWMpIDoge307XG4gICAgdGhpcy5fc3BlYy5yZW5kZXJOb2RlID0gcmVuZGVyTm9kZTtcbiAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSB0cnVlO1xuICAgIHRoaXMuX2ludmFsaWRhdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fcmVtb3ZpbmcgPSBmYWxzZTtcbn1cbkxheW91dE5vZGUucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xufTtcbkxheW91dE5vZGUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5yZW5kZXJOb2RlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3NwZWMucmVuZGVyTm9kZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSB1bmRlZmluZWQ7XG59O1xuTGF5b3V0Tm9kZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5faW52YWxpZGF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLnRydWVTaXplUmVxdWVzdGVkID0gZmFsc2U7XG59O1xuTGF5b3V0Tm9kZS5wcm90b3R5cGUuc2V0U3BlYyA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gICAgdGhpcy5fc3BlY01vZGlmaWVkID0gdHJ1ZTtcbiAgICBpZiAoc3BlYy5hbGlnbikge1xuICAgICAgICBpZiAoIXNwZWMuYWxpZ24pIHtcbiAgICAgICAgICAgIHRoaXMuX3NwZWMuYWxpZ24gPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NwZWMuYWxpZ25bMF0gPSBzcGVjLmFsaWduWzBdO1xuICAgICAgICB0aGlzLl9zcGVjLmFsaWduWzFdID0gc3BlYy5hbGlnblsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zcGVjLmFsaWduID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoc3BlYy5vcmlnaW4pIHtcbiAgICAgICAgaWYgKCFzcGVjLm9yaWdpbikge1xuICAgICAgICAgICAgdGhpcy5fc3BlYy5vcmlnaW4gPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NwZWMub3JpZ2luWzBdID0gc3BlYy5vcmlnaW5bMF07XG4gICAgICAgIHRoaXMuX3NwZWMub3JpZ2luWzFdID0gc3BlYy5vcmlnaW5bMV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3BlYy5vcmlnaW4gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChzcGVjLnNpemUpIHtcbiAgICAgICAgaWYgKCFzcGVjLnNpemUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NwZWMuc2l6ZSA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3BlYy5zaXplWzBdID0gc3BlYy5zaXplWzBdO1xuICAgICAgICB0aGlzLl9zcGVjLnNpemVbMV0gPSBzcGVjLnNpemVbMV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3BlYy5zaXplID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoc3BlYy50cmFuc2Zvcm0pIHtcbiAgICAgICAgaWYgKCFzcGVjLnRyYW5zZm9ybSkge1xuICAgICAgICAgICAgdGhpcy5fc3BlYy50cmFuc2Zvcm0gPSBzcGVjLnRyYW5zZm9ybS5zbGljZSgwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NwZWMudHJhbnNmb3JtWzBdID0gc3BlYy50cmFuc2Zvcm1bMF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zcGVjLnRyYW5zZm9ybSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdGhpcy5fc3BlYy5vcGFjaXR5ID0gc3BlYy5vcGFjaXR5O1xufTtcbkxheW91dE5vZGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChzZXQsIHNpemUpIHtcbiAgICB0aGlzLl9pbnZhbGlkYXRlZCA9IHRydWU7XG4gICAgdGhpcy5fc3BlY01vZGlmaWVkID0gdHJ1ZTtcbiAgICB0aGlzLl9yZW1vdmluZyA9IGZhbHNlO1xuICAgIHZhciBzcGVjID0gdGhpcy5fc3BlYztcbiAgICBzcGVjLm9wYWNpdHkgPSBzZXQub3BhY2l0eTtcbiAgICBpZiAoc2V0LnNpemUpIHtcbiAgICAgICAgaWYgKCFzcGVjLnNpemUpIHtcbiAgICAgICAgICAgIHNwZWMuc2l6ZSA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgc3BlYy5zaXplWzBdID0gc2V0LnNpemVbMF07XG4gICAgICAgIHNwZWMuc2l6ZVsxXSA9IHNldC5zaXplWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMuc2l6ZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHNldC5vcmlnaW4pIHtcbiAgICAgICAgaWYgKCFzcGVjLm9yaWdpbikge1xuICAgICAgICAgICAgc3BlYy5vcmlnaW4gPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHNwZWMub3JpZ2luWzBdID0gc2V0Lm9yaWdpblswXTtcbiAgICAgICAgc3BlYy5vcmlnaW5bMV0gPSBzZXQub3JpZ2luWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMub3JpZ2luID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoc2V0LmFsaWduKSB7XG4gICAgICAgIGlmICghc3BlYy5hbGlnbikge1xuICAgICAgICAgICAgc3BlYy5hbGlnbiA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgc3BlYy5hbGlnblswXSA9IHNldC5hbGlnblswXTtcbiAgICAgICAgc3BlYy5hbGlnblsxXSA9IHNldC5hbGlnblsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzcGVjLmFsaWduID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoc2V0LnNrZXcgfHwgc2V0LnJvdGF0ZSB8fCBzZXQuc2NhbGUpIHtcbiAgICAgICAgdGhpcy5fc3BlYy50cmFuc2Zvcm0gPSBUcmFuc2Zvcm0uYnVpbGQoe1xuICAgICAgICAgICAgdHJhbnNsYXRlOiBzZXQudHJhbnNsYXRlIHx8IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHNrZXc6IHNldC5za2V3IHx8IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHNjYWxlOiBzZXQuc2NhbGUgfHwgW1xuICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICAxXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcm90YXRlOiBzZXQucm90YXRlIHx8IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHNldC50cmFuc2xhdGUpIHtcbiAgICAgICAgdGhpcy5fc3BlYy50cmFuc2Zvcm0gPSBUcmFuc2Zvcm0udHJhbnNsYXRlKHNldC50cmFuc2xhdGVbMF0sIHNldC50cmFuc2xhdGVbMV0sIHNldC50cmFuc2xhdGVbMl0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3NwZWMudHJhbnNmb3JtID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLnNjcm9sbExlbmd0aCA9IHNldC5zY3JvbGxMZW5ndGg7XG59O1xuTGF5b3V0Tm9kZS5wcm90b3R5cGUuZ2V0U3BlYyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9zcGVjLnJlbW92ZWQgPSAhdGhpcy5faW52YWxpZGF0ZWQ7XG4gICAgcmV0dXJuIHRoaXMuX3NwZWM7XG59O1xuTGF5b3V0Tm9kZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKHJlbW92ZVNwZWMpIHtcbiAgICB0aGlzLl9yZW1vdmluZyA9IHRydWU7XG59O1xubW9kdWxlLmV4cG9ydHMgPSBMYXlvdXROb2RlOyIsInZhciBMYXlvdXRDb250ZXh0ID0gcmVxdWlyZSgnLi9MYXlvdXRDb250ZXh0Jyk7XG52YXIgTGF5b3V0VXRpbGl0eSA9IHJlcXVpcmUoJy4vTGF5b3V0VXRpbGl0eScpO1xudmFyIE1BWF9QT09MX1NJWkUgPSAxMDA7XG5mdW5jdGlvbiBMYXlvdXROb2RlTWFuYWdlcihMYXlvdXROb2RlLCBpbml0TGF5b3V0Tm9kZUZuKSB7XG4gICAgdGhpcy5MYXlvdXROb2RlID0gTGF5b3V0Tm9kZTtcbiAgICB0aGlzLl9pbml0TGF5b3V0Tm9kZUZuID0gaW5pdExheW91dE5vZGVGbjtcbiAgICB0aGlzLl9sYXlvdXRDb3VudCA9IDA7XG4gICAgdGhpcy5fY29udGV4dCA9IG5ldyBMYXlvdXRDb250ZXh0KHtcbiAgICAgICAgbmV4dDogX2NvbnRleHROZXh0LmJpbmQodGhpcyksXG4gICAgICAgIHByZXY6IF9jb250ZXh0UHJldi5iaW5kKHRoaXMpLFxuICAgICAgICBnZXQ6IF9jb250ZXh0R2V0LmJpbmQodGhpcyksXG4gICAgICAgIHNldDogX2NvbnRleHRTZXQuYmluZCh0aGlzKSxcbiAgICAgICAgcmVzb2x2ZVNpemU6IF9jb250ZXh0UmVzb2x2ZVNpemUuYmluZCh0aGlzKSxcbiAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXVxuICAgIH0pO1xuICAgIHRoaXMuX2NvbnRleHRTdGF0ZSA9IHt9O1xuICAgIHRoaXMuX3Bvb2wgPSB7XG4gICAgICAgIGxheW91dE5vZGVzOiB7IHNpemU6IDAgfSxcbiAgICAgICAgcmVzb2x2ZVNpemU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF1cbiAgICB9O1xufVxuTGF5b3V0Tm9kZU1hbmFnZXIucHJvdG90eXBlLnByZXBhcmVGb3JMYXlvdXQgPSBmdW5jdGlvbiAodmlld1NlcXVlbmNlLCBub2Rlc0J5SWQsIGNvbnRleHREYXRhKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9maXJzdDtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBub2RlLnJlc2V0KCk7XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICB2YXIgY29udGV4dCA9IHRoaXMuX2NvbnRleHQ7XG4gICAgdGhpcy5fbGF5b3V0Q291bnQrKztcbiAgICB0aGlzLl9ub2Rlc0J5SWQgPSBub2Rlc0J5SWQ7XG4gICAgdGhpcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9yZWV2YWxUcnVlU2l6ZSA9IGNvbnRleHREYXRhLnJlZXZhbFRydWVTaXplIHx8ICFjb250ZXh0LnNpemUgfHwgY29udGV4dC5zaXplWzBdICE9PSBjb250ZXh0RGF0YS5zaXplWzBdIHx8IGNvbnRleHQuc2l6ZVsxXSAhPT0gY29udGV4dERhdGEuc2l6ZVsxXTtcbiAgICB2YXIgY29udGV4dFN0YXRlID0gdGhpcy5fY29udGV4dFN0YXRlO1xuICAgIGNvbnRleHRTdGF0ZS5uZXh0U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2U7XG4gICAgY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZTtcbiAgICBjb250ZXh0U3RhdGUuc3RhcnQgPSB1bmRlZmluZWQ7XG4gICAgY29udGV4dFN0YXRlLm5leHRHZXRJbmRleCA9IDA7XG4gICAgY29udGV4dFN0YXRlLnByZXZHZXRJbmRleCA9IDA7XG4gICAgY29udGV4dFN0YXRlLm5leHRTZXRJbmRleCA9IDA7XG4gICAgY29udGV4dFN0YXRlLnByZXZTZXRJbmRleCA9IDA7XG4gICAgY29udGV4dFN0YXRlLmFkZENvdW50ID0gMDtcbiAgICBjb250ZXh0U3RhdGUucmVtb3ZlQ291bnQgPSAwO1xuICAgIGNvbnRleHQuc2l6ZVswXSA9IGNvbnRleHREYXRhLnNpemVbMF07XG4gICAgY29udGV4dC5zaXplWzFdID0gY29udGV4dERhdGEuc2l6ZVsxXTtcbiAgICBjb250ZXh0LmRpcmVjdGlvbiA9IGNvbnRleHREYXRhLmRpcmVjdGlvbjtcbiAgICBjb250ZXh0LnJldmVyc2UgPSBjb250ZXh0RGF0YS5yZXZlcnNlO1xuICAgIGNvbnRleHQuYWxpZ25tZW50ID0gY29udGV4dERhdGEucmV2ZXJzZSA/IDEgOiAwO1xuICAgIGNvbnRleHQuc2Nyb2xsT2Zmc2V0ID0gY29udGV4dERhdGEuc2Nyb2xsT2Zmc2V0IHx8IDA7XG4gICAgY29udGV4dC5zY3JvbGxTdGFydCA9IGNvbnRleHREYXRhLnNjcm9sbFN0YXJ0IHx8IDA7XG4gICAgY29udGV4dC5zY3JvbGxFbmQgPSBjb250ZXh0RGF0YS5zY3JvbGxFbmQgfHwgY29udGV4dC5zaXplW2NvbnRleHQuZGlyZWN0aW9uXTtcbiAgICByZXR1cm4gY29udGV4dDtcbn07XG5MYXlvdXROb2RlTWFuYWdlci5wcm90b3R5cGUucmVtb3ZlTm9uSW52YWxpZGF0ZWROb2RlcyA9IGZ1bmN0aW9uIChyZW1vdmVTcGVjKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9maXJzdDtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkICYmICFub2RlLl9yZW1vdmluZykge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmUocmVtb3ZlU3BlYyk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgfVxufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5idWlsZFNwZWNBbmREZXN0cm95VW5yZW5kZXJlZE5vZGVzID0gZnVuY3Rpb24gKHRyYW5zbGF0ZSkge1xuICAgIHZhciBzcGVjcyA9IFtdO1xuICAgIHZhciByZXN1bHQgPSB7XG4gICAgICAgICAgICBzcGVjczogc3BlY3MsXG4gICAgICAgICAgICBtb2RpZmllZDogZmFsc2VcbiAgICAgICAgfTtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX2ZpcnN0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIHZhciBtb2RpZmllZCA9IG5vZGUuX3NwZWNNb2RpZmllZDtcbiAgICAgICAgdmFyIHNwZWMgPSBub2RlLmdldFNwZWMoKTtcbiAgICAgICAgaWYgKHNwZWMucmVtb3ZlZCkge1xuICAgICAgICAgICAgdmFyIGRlc3Ryb3lOb2RlID0gbm9kZTtcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgICAgICAgICAgX2Rlc3Ryb3lOb2RlLmNhbGwodGhpcywgZGVzdHJveU5vZGUpO1xuICAgICAgICAgICAgcmVzdWx0Lm1vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChtb2RpZmllZCkge1xuICAgICAgICAgICAgICAgIGlmIChzcGVjLnRyYW5zZm9ybSAmJiB0cmFuc2xhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTJdICs9IHRyYW5zbGF0ZVswXTtcbiAgICAgICAgICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTNdICs9IHRyYW5zbGF0ZVsxXTtcbiAgICAgICAgICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTRdICs9IHRyYW5zbGF0ZVsyXTtcbiAgICAgICAgICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTJdID0gTWF0aC5yb3VuZChzcGVjLnRyYW5zZm9ybVsxMl0gKiAxMDAwMDApIC8gMTAwMDAwO1xuICAgICAgICAgICAgICAgICAgICBzcGVjLnRyYW5zZm9ybVsxM10gPSBNYXRoLnJvdW5kKHNwZWMudHJhbnNmb3JtWzEzXSAqIDEwMDAwMCkgLyAxMDAwMDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdC5tb2RpZmllZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzcGVjcy5wdXNoKHNwZWMpO1xuICAgICAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fY29udGV4dFN0YXRlLmFkZENvdW50ID0gMDtcbiAgICB0aGlzLl9jb250ZXh0U3RhdGUucmVtb3ZlQ291bnQgPSAwO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuTGF5b3V0Tm9kZU1hbmFnZXIucHJvdG90eXBlLmdldE5vZGVCeVJlbmRlck5vZGUgPSBmdW5jdGlvbiAocmVuZGVyYWJsZSkge1xuICAgIHZhciBub2RlID0gdGhpcy5fZmlyc3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUucmVuZGVyTm9kZSA9PT0gcmVuZGVyYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59O1xuTGF5b3V0Tm9kZU1hbmFnZXIucHJvdG90eXBlLmluc2VydE5vZGUgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIG5vZGUuX25leHQgPSB0aGlzLl9maXJzdDtcbiAgICBpZiAodGhpcy5fZmlyc3QpIHtcbiAgICAgICAgdGhpcy5fZmlyc3QuX3ByZXYgPSBub2RlO1xuICAgIH1cbiAgICB0aGlzLl9maXJzdCA9IG5vZGU7XG59O1xuTGF5b3V0Tm9kZU1hbmFnZXIucHJvdG90eXBlLnNldE5vZGVPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB0aGlzLl9ub2RlT3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9maXJzdDtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBub2RlLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICBub2RlID0gdGhpcy5fcG9vbC5sYXlvdXROb2Rlcy5maXJzdDtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBub2RlLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbn07XG5MYXlvdXROb2RlTWFuYWdlci5wcm90b3R5cGUucHJlYWxsb2NhdGVOb2RlcyA9IGZ1bmN0aW9uIChjb3VudCwgc3BlYykge1xuICAgIHZhciBub2RlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICBub2Rlcy5wdXNoKHRoaXMuY3JlYXRlTm9kZSh1bmRlZmluZWQsIHNwZWMpKTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgX2Rlc3Ryb3lOb2RlLmNhbGwodGhpcywgbm9kZXNbaV0pO1xuICAgIH1cbn07XG5MYXlvdXROb2RlTWFuYWdlci5wcm90b3R5cGUuY3JlYXRlTm9kZSA9IGZ1bmN0aW9uIChyZW5kZXJOb2RlLCBzcGVjKSB7XG4gICAgdmFyIG5vZGU7XG4gICAgaWYgKHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuZmlyc3QpIHtcbiAgICAgICAgbm9kZSA9IHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuZmlyc3Q7XG4gICAgICAgIHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuZmlyc3QgPSBub2RlLl9uZXh0O1xuICAgICAgICB0aGlzLl9wb29sLmxheW91dE5vZGVzLnNpemUtLTtcbiAgICAgICAgbm9kZS5jb25zdHJ1Y3Rvci5hcHBseShub2RlLCBhcmd1bWVudHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUgPSBuZXcgdGhpcy5MYXlvdXROb2RlKHJlbmRlck5vZGUsIHNwZWMpO1xuICAgICAgICBpZiAodGhpcy5fbm9kZU9wdGlvbnMpIHtcbiAgICAgICAgICAgIG5vZGUuc2V0T3B0aW9ucyh0aGlzLl9ub2RlT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbm9kZS5fcHJldiA9IHVuZGVmaW5lZDtcbiAgICBub2RlLl9uZXh0ID0gdW5kZWZpbmVkO1xuICAgIG5vZGUuX3ZpZXdTZXF1ZW5jZSA9IHVuZGVmaW5lZDtcbiAgICBub2RlLl9sYXlvdXRDb3VudCA9IDA7XG4gICAgaWYgKHRoaXMuX2luaXRMYXlvdXROb2RlRm4pIHtcbiAgICAgICAgdGhpcy5faW5pdExheW91dE5vZGVGbi5jYWxsKHRoaXMsIG5vZGUsIHNwZWMpO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbn07XG5mdW5jdGlvbiBfZGVzdHJveU5vZGUobm9kZSkge1xuICAgIGlmIChub2RlLl9uZXh0KSB7XG4gICAgICAgIG5vZGUuX25leHQuX3ByZXYgPSBub2RlLl9wcmV2O1xuICAgIH1cbiAgICBpZiAobm9kZS5fcHJldikge1xuICAgICAgICBub2RlLl9wcmV2Ll9uZXh0ID0gbm9kZS5fbmV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9maXJzdCA9IG5vZGUuX25leHQ7XG4gICAgfVxuICAgIG5vZGUuZGVzdHJveSgpO1xuICAgIGlmICh0aGlzLl9wb29sLmxheW91dE5vZGVzLnNpemUgPCBNQVhfUE9PTF9TSVpFKSB7XG4gICAgICAgIHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuc2l6ZSsrO1xuICAgICAgICBub2RlLl9wcmV2ID0gdW5kZWZpbmVkO1xuICAgICAgICBub2RlLl9uZXh0ID0gdGhpcy5fcG9vbC5sYXlvdXROb2Rlcy5maXJzdDtcbiAgICAgICAgdGhpcy5fcG9vbC5sYXlvdXROb2Rlcy5maXJzdCA9IG5vZGU7XG4gICAgfVxufVxuTGF5b3V0Tm9kZU1hbmFnZXIucHJvdG90eXBlLmdldFN0YXJ0RW51bU5vZGUgPSBmdW5jdGlvbiAobmV4dCkge1xuICAgIGlmIChuZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpcnN0O1xuICAgIH0gZWxzZSBpZiAobmV4dCA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0ICYmIHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydFByZXYgPyB0aGlzLl9jb250ZXh0U3RhdGUuc3RhcnQuX25leHQgOiB0aGlzLl9jb250ZXh0U3RhdGUuc3RhcnQ7XG4gICAgfSBlbHNlIGlmIChuZXh0ID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0ICYmICF0aGlzLl9jb250ZXh0U3RhdGUuc3RhcnRQcmV2ID8gdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0Ll9wcmV2IDogdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0O1xuICAgIH1cbn07XG5mdW5jdGlvbiBfY29udGV4dEdldENyZWF0ZUFuZE9yZGVyTm9kZXMocmVuZGVyTm9kZSwgcHJldikge1xuICAgIHZhciBub2RlO1xuICAgIHZhciBzdGF0ZSA9IHRoaXMuX2NvbnRleHRTdGF0ZTtcbiAgICBpZiAoIXN0YXRlLnN0YXJ0KSB7XG4gICAgICAgIG5vZGUgPSB0aGlzLl9maXJzdDtcbiAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnJlbmRlck5vZGUgPT09IHJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgICAgICB9XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgbm9kZSA9IHRoaXMuY3JlYXRlTm9kZShyZW5kZXJOb2RlKTtcbiAgICAgICAgICAgIG5vZGUuX25leHQgPSB0aGlzLl9maXJzdDtcbiAgICAgICAgICAgIGlmICh0aGlzLl9maXJzdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpcnN0Ll9wcmV2ID0gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2ZpcnN0ID0gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5zdGFydCA9IG5vZGU7XG4gICAgICAgIHN0YXRlLnN0YXJ0UHJldiA9IHByZXY7XG4gICAgICAgIHN0YXRlLnByZXYgPSBub2RlO1xuICAgICAgICBzdGF0ZS5uZXh0ID0gbm9kZTtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICAgIGlmIChwcmV2KSB7XG4gICAgICAgIGlmIChzdGF0ZS5wcmV2Ll9wcmV2ICYmIHN0YXRlLnByZXYuX3ByZXYucmVuZGVyTm9kZSA9PT0gcmVuZGVyTm9kZSkge1xuICAgICAgICAgICAgc3RhdGUucHJldiA9IHN0YXRlLnByZXYuX3ByZXY7XG4gICAgICAgICAgICByZXR1cm4gc3RhdGUucHJldjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzdGF0ZS5uZXh0Ll9uZXh0ICYmIHN0YXRlLm5leHQuX25leHQucmVuZGVyTm9kZSA9PT0gcmVuZGVyTm9kZSkge1xuICAgICAgICAgICAgc3RhdGUubmV4dCA9IHN0YXRlLm5leHQuX25leHQ7XG4gICAgICAgICAgICByZXR1cm4gc3RhdGUubmV4dDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBub2RlID0gdGhpcy5fZmlyc3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUucmVuZGVyTm9kZSA9PT0gcmVuZGVyTm9kZSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgfVxuICAgIGlmICghbm9kZSkge1xuICAgICAgICBub2RlID0gdGhpcy5jcmVhdGVOb2RlKHJlbmRlck5vZGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChub2RlLl9uZXh0KSB7XG4gICAgICAgICAgICBub2RlLl9uZXh0Ll9wcmV2ID0gbm9kZS5fcHJldjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5fcHJldikge1xuICAgICAgICAgICAgbm9kZS5fcHJldi5fbmV4dCA9IG5vZGUuX25leHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9maXJzdCA9IG5vZGUuX25leHQ7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS5fbmV4dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgbm9kZS5fcHJldiA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHByZXYpIHtcbiAgICAgICAgaWYgKHN0YXRlLnByZXYuX3ByZXYpIHtcbiAgICAgICAgICAgIG5vZGUuX3ByZXYgPSBzdGF0ZS5wcmV2Ll9wcmV2O1xuICAgICAgICAgICAgc3RhdGUucHJldi5fcHJldi5fbmV4dCA9IG5vZGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9maXJzdCA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUucHJldi5fcHJldiA9IG5vZGU7XG4gICAgICAgIG5vZGUuX25leHQgPSBzdGF0ZS5wcmV2O1xuICAgICAgICBzdGF0ZS5wcmV2ID0gbm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc3RhdGUubmV4dC5fbmV4dCkge1xuICAgICAgICAgICAgbm9kZS5fbmV4dCA9IHN0YXRlLm5leHQuX25leHQ7XG4gICAgICAgICAgICBzdGF0ZS5uZXh0Ll9uZXh0Ll9wcmV2ID0gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5uZXh0Ll9uZXh0ID0gbm9kZTtcbiAgICAgICAgbm9kZS5fcHJldiA9IHN0YXRlLm5leHQ7XG4gICAgICAgIHN0YXRlLm5leHQgPSBub2RlO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbn1cbmZ1bmN0aW9uIF9jb250ZXh0TmV4dCgpIHtcbiAgICBpZiAoIXRoaXMuX2NvbnRleHRTdGF0ZS5uZXh0U2VxdWVuY2UpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2NvbnRleHQucmV2ZXJzZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgICAgIGlmICghdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXF1ZW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgcmVuZGVyTm9kZSA9IHRoaXMuX2NvbnRleHRTdGF0ZS5uZXh0U2VxdWVuY2UuZ2V0KCk7XG4gICAgaWYgKCFyZW5kZXJOb2RlKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5uZXh0U2VxdWVuY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHZhciBuZXh0U2VxdWVuY2UgPSB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlO1xuICAgIGlmICghdGhpcy5fY29udGV4dC5yZXZlcnNlKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5uZXh0U2VxdWVuY2UgPSB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlLmdldE5leHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyTm9kZTogcmVuZGVyTm9kZSxcbiAgICAgICAgdmlld1NlcXVlbmNlOiBuZXh0U2VxdWVuY2UsXG4gICAgICAgIG5leHQ6IHRydWUsXG4gICAgICAgIGluZGV4OiArK3RoaXMuX2NvbnRleHRTdGF0ZS5uZXh0R2V0SW5kZXhcbiAgICB9O1xufVxuZnVuY3Rpb24gX2NvbnRleHRQcmV2KCkge1xuICAgIGlmICghdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX2NvbnRleHQucmV2ZXJzZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgICAgICBpZiAoIXRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIHJlbmRlck5vZGUgPSB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNlcXVlbmNlLmdldCgpO1xuICAgIGlmICghcmVuZGVyTm9kZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNlcXVlbmNlID0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB2YXIgcHJldlNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZTtcbiAgICBpZiAodGhpcy5fY29udGV4dC5yZXZlcnNlKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2VxdWVuY2UgPSB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNlcXVlbmNlLmdldFByZXZpb3VzKCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlck5vZGU6IHJlbmRlck5vZGUsXG4gICAgICAgIHZpZXdTZXF1ZW5jZTogcHJldlNlcXVlbmNlLFxuICAgICAgICBwcmV2OiB0cnVlLFxuICAgICAgICBpbmRleDogLS10aGlzLl9jb250ZXh0U3RhdGUucHJldkdldEluZGV4XG4gICAgfTtcbn1cbmZ1bmN0aW9uIF9jb250ZXh0R2V0KGNvbnRleHROb2RlT3JJZCkge1xuICAgIGlmICh0aGlzLl9ub2Rlc0J5SWQgJiYgKGNvbnRleHROb2RlT3JJZCBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2YgY29udGV4dE5vZGVPcklkID09PSAnc3RyaW5nJykpIHtcbiAgICAgICAgdmFyIHJlbmRlck5vZGUgPSB0aGlzLl9ub2Rlc0J5SWRbY29udGV4dE5vZGVPcklkXTtcbiAgICAgICAgaWYgKCFyZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZW5kZXJOb2RlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gcmVuZGVyTm9kZS5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHJlbmRlck5vZGU6IHJlbmRlck5vZGVbaV0sXG4gICAgICAgICAgICAgICAgICAgIGFycmF5RWxlbWVudDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVuZGVyTm9kZTogcmVuZGVyTm9kZSxcbiAgICAgICAgICAgIGJ5SWQ6IHRydWVcbiAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY29udGV4dE5vZGVPcklkO1xuICAgIH1cbn1cbmZ1bmN0aW9uIF9jb250ZXh0U2V0KGNvbnRleHROb2RlT3JJZCwgc2V0KSB7XG4gICAgdmFyIGNvbnRleHROb2RlID0gdGhpcy5fbm9kZXNCeUlkID8gX2NvbnRleHRHZXQuY2FsbCh0aGlzLCBjb250ZXh0Tm9kZU9ySWQpIDogY29udGV4dE5vZGVPcklkO1xuICAgIGlmIChjb250ZXh0Tm9kZSkge1xuICAgICAgICB2YXIgbm9kZSA9IGNvbnRleHROb2RlLm5vZGU7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgaWYgKGNvbnRleHROb2RlLm5leHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29udGV4dE5vZGUuaW5kZXggPCB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNldEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIExheW91dFV0aWxpdHkuZXJyb3IoJ05vZGVzIG11c3QgYmUgbGF5ZWQgb3V0IGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgd2VyZSByZXF1ZXN0ZWQhJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5uZXh0U2V0SW5kZXggPSBjb250ZXh0Tm9kZS5pbmRleDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29udGV4dE5vZGUucHJldikge1xuICAgICAgICAgICAgICAgIGlmIChjb250ZXh0Tm9kZS5pbmRleCA+IHRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2V0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgTGF5b3V0VXRpbGl0eS5lcnJvcignTm9kZXMgbXVzdCBiZSBsYXllZCBvdXQgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhleSB3ZXJlIHJlcXVlc3RlZCEnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXRJbmRleCA9IGNvbnRleHROb2RlLmluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZSA9IF9jb250ZXh0R2V0Q3JlYXRlQW5kT3JkZXJOb2Rlcy5jYWxsKHRoaXMsIGNvbnRleHROb2RlLnJlbmRlck5vZGUsIGNvbnRleHROb2RlLnByZXYpO1xuICAgICAgICAgICAgbm9kZS5fdmlld1NlcXVlbmNlID0gY29udGV4dE5vZGUudmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgbm9kZS5fbGF5b3V0Q291bnQrKztcbiAgICAgICAgICAgIGlmIChub2RlLl9sYXlvdXRDb3VudCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5hZGRDb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dE5vZGUubm9kZSA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS51c2VzVHJ1ZVNpemUgPSBjb250ZXh0Tm9kZS51c2VzVHJ1ZVNpemU7XG4gICAgICAgIG5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQgPSBjb250ZXh0Tm9kZS50cnVlU2l6ZVJlcXVlc3RlZDtcbiAgICAgICAgbm9kZS5zZXQoc2V0LCB0aGlzLl9jb250ZXh0LnNpemUpO1xuICAgICAgICBjb250ZXh0Tm9kZS5zZXQgPSBzZXQ7XG4gICAgfVxufVxuZnVuY3Rpb24gX2NvbnRleHRSZXNvbHZlU2l6ZShjb250ZXh0Tm9kZU9ySWQsIHBhcmVudFNpemUpIHtcbiAgICB2YXIgY29udGV4dE5vZGUgPSB0aGlzLl9ub2Rlc0J5SWQgPyBfY29udGV4dEdldC5jYWxsKHRoaXMsIGNvbnRleHROb2RlT3JJZCkgOiBjb250ZXh0Tm9kZU9ySWQ7XG4gICAgdmFyIHJlc29sdmVTaXplID0gdGhpcy5fcG9vbC5yZXNvbHZlU2l6ZTtcbiAgICBpZiAoIWNvbnRleHROb2RlKSB7XG4gICAgICAgIHJlc29sdmVTaXplWzBdID0gMDtcbiAgICAgICAgcmVzb2x2ZVNpemVbMV0gPSAwO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZVNpemU7XG4gICAgfVxuICAgIHZhciByZW5kZXJOb2RlID0gY29udGV4dE5vZGUucmVuZGVyTm9kZTtcbiAgICB2YXIgc2l6ZSA9IHJlbmRlck5vZGUuZ2V0U2l6ZSgpO1xuICAgIGlmICghc2l6ZSkge1xuICAgICAgICByZXR1cm4gcGFyZW50U2l6ZTtcbiAgICB9XG4gICAgdmFyIGNvbmZpZ1NpemUgPSByZW5kZXJOb2RlLnNpemUgJiYgcmVuZGVyTm9kZS5fdHJ1ZVNpemVDaGVjayAhPT0gdW5kZWZpbmVkID8gcmVuZGVyTm9kZS5zaXplIDogdW5kZWZpbmVkO1xuICAgIGlmIChjb25maWdTaXplICYmIChjb25maWdTaXplWzBdID09PSB0cnVlIHx8IGNvbmZpZ1NpemVbMV0gPT09IHRydWUpKSB7XG4gICAgICAgIGNvbnRleHROb2RlLnVzZXNUcnVlU2l6ZSA9IHRydWU7XG4gICAgICAgIHZhciBiYWNrdXBTaXplID0gcmVuZGVyTm9kZS5fYmFja3VwU2l6ZTtcbiAgICAgICAgaWYgKHJlbmRlck5vZGUuX3RydWVTaXplQ2hlY2spIHtcbiAgICAgICAgICAgIGlmIChiYWNrdXBTaXplICYmIGNvbmZpZ1NpemUgIT09IHNpemUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV3V2lkdGggPSBjb25maWdTaXplWzBdID09PSB0cnVlID8gTWF0aC5tYXgoYmFja3VwU2l6ZVswXSwgc2l6ZVswXSkgOiBzaXplWzBdO1xuICAgICAgICAgICAgICAgIHZhciBuZXdIZWlnaHQgPSBjb25maWdTaXplWzFdID09PSB0cnVlID8gTWF0aC5tYXgoYmFja3VwU2l6ZVsxXSwgc2l6ZVsxXSkgOiBzaXplWzFdO1xuICAgICAgICAgICAgICAgIGlmIChuZXdXaWR0aCAhPT0gYmFja3VwU2l6ZVswXSB8fCBuZXdIZWlnaHQgIT09IGJhY2t1cFNpemVbMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0Tm9kZS50cnVlU2l6ZVJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJhY2t1cFNpemVbMF0gPSBuZXdXaWR0aDtcbiAgICAgICAgICAgICAgICBiYWNrdXBTaXplWzFdID0gbmV3SGVpZ2h0O1xuICAgICAgICAgICAgICAgIHNpemUgPSBiYWNrdXBTaXplO1xuICAgICAgICAgICAgICAgIHJlbmRlck5vZGUuX2JhY2t1cFNpemUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgYmFja3VwU2l6ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnRleHROb2RlLnRydWVTaXplUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcmVldmFsVHJ1ZVNpemUgfHwgYmFja3VwU2l6ZSAmJiAoYmFja3VwU2l6ZVswXSAhPT0gc2l6ZVswXSB8fCBiYWNrdXBTaXplWzFdICE9PSBzaXplWzFdKSkge1xuICAgICAgICAgICAgcmVuZGVyTm9kZS5fdHJ1ZVNpemVDaGVjayA9IHRydWU7XG4gICAgICAgICAgICByZW5kZXJOb2RlLl9zaXplRGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYmFja3VwU2l6ZSkge1xuICAgICAgICAgICAgcmVuZGVyTm9kZS5fYmFja3VwU2l6ZSA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICBiYWNrdXBTaXplID0gcmVuZGVyTm9kZS5fYmFja3VwU2l6ZTtcbiAgICAgICAgfVxuICAgICAgICBiYWNrdXBTaXplWzBdID0gc2l6ZVswXTtcbiAgICAgICAgYmFja3VwU2l6ZVsxXSA9IHNpemVbMV07XG4gICAgfVxuICAgIGNvbmZpZ1NpemUgPSByZW5kZXJOb2RlLl9ub2RlcyA/IHJlbmRlck5vZGUub3B0aW9ucy5zaXplIDogdW5kZWZpbmVkO1xuICAgIGlmIChjb25maWdTaXplICYmIChjb25maWdTaXplWzBdID09PSB0cnVlIHx8IGNvbmZpZ1NpemVbMV0gPT09IHRydWUpKSB7XG4gICAgICAgIGlmICh0aGlzLl9yZWV2YWxUcnVlU2l6ZSB8fCByZW5kZXJOb2RlLl9ub2Rlcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQpIHtcbiAgICAgICAgICAgIGNvbnRleHROb2RlLnVzZXNUcnVlU2l6ZSA9IHRydWU7XG4gICAgICAgICAgICBjb250ZXh0Tm9kZS50cnVlU2l6ZVJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl90cnVlU2l6ZVJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNpemVbMF0gPT09IHVuZGVmaW5lZCB8fCBzaXplWzBdID09PSB0cnVlIHx8IHNpemVbMV0gPT09IHVuZGVmaW5lZCB8fCBzaXplWzFdID09PSB0cnVlKSB7XG4gICAgICAgIHJlc29sdmVTaXplWzBdID0gc2l6ZVswXTtcbiAgICAgICAgcmVzb2x2ZVNpemVbMV0gPSBzaXplWzFdO1xuICAgICAgICBzaXplID0gcmVzb2x2ZVNpemU7XG4gICAgICAgIGlmIChzaXplWzBdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNpemVbMF0gPSBwYXJlbnRTaXplWzBdO1xuICAgICAgICB9IGVsc2UgaWYgKHNpemVbMF0gPT09IHRydWUpIHtcbiAgICAgICAgICAgIHNpemVbMF0gPSAwO1xuICAgICAgICAgICAgdGhpcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgY29udGV4dE5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaXplWzFdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNpemVbMV0gPSBwYXJlbnRTaXplWzFdO1xuICAgICAgICB9IGVsc2UgaWYgKHNpemVbMV0gPT09IHRydWUpIHtcbiAgICAgICAgICAgIHNpemVbMV0gPSAwO1xuICAgICAgICAgICAgdGhpcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgY29udGV4dE5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzaXplO1xufVxubW9kdWxlLmV4cG9ydHMgPSBMYXlvdXROb2RlTWFuYWdlcjsiLCJ2YXIgVXRpbGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IG51bGw7XG5mdW5jdGlvbiBMYXlvdXRVdGlsaXR5KCkge1xufVxuTGF5b3V0VXRpbGl0eS5yZWdpc3RlcmVkSGVscGVycyA9IHt9O1xudmFyIENhcGFiaWxpdGllcyA9IHtcbiAgICAgICAgU0VRVUVOQ0U6IDEsXG4gICAgICAgIERJUkVDVElPTl9YOiAyLFxuICAgICAgICBESVJFQ1RJT05fWTogNCxcbiAgICAgICAgU0NST0xMSU5HOiA4XG4gICAgfTtcbkxheW91dFV0aWxpdHkuQ2FwYWJpbGl0aWVzID0gQ2FwYWJpbGl0aWVzO1xuTGF5b3V0VXRpbGl0eS5ub3JtYWxpemVNYXJnaW5zID0gZnVuY3Rpb24gKG1hcmdpbnMpIHtcbiAgICBpZiAoIW1hcmdpbnMpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICB9IGVsc2UgaWYgKCFBcnJheS5pc0FycmF5KG1hcmdpbnMpKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBtYXJnaW5zLFxuICAgICAgICAgICAgbWFyZ2lucyxcbiAgICAgICAgICAgIG1hcmdpbnMsXG4gICAgICAgICAgICBtYXJnaW5zXG4gICAgICAgIF07XG4gICAgfSBlbHNlIGlmIChtYXJnaW5zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdO1xuICAgIH0gZWxzZSBpZiAobWFyZ2lucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIG1hcmdpbnNbMF0sXG4gICAgICAgICAgICBtYXJnaW5zWzBdLFxuICAgICAgICAgICAgbWFyZ2luc1swXSxcbiAgICAgICAgICAgIG1hcmdpbnNbMF1cbiAgICAgICAgXTtcbiAgICB9IGVsc2UgaWYgKG1hcmdpbnMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBtYXJnaW5zWzBdLFxuICAgICAgICAgICAgbWFyZ2luc1sxXSxcbiAgICAgICAgICAgIG1hcmdpbnNbMF0sXG4gICAgICAgICAgICBtYXJnaW5zWzFdXG4gICAgICAgIF07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG1hcmdpbnM7XG4gICAgfVxufTtcbkxheW91dFV0aWxpdHkuY2xvbmVTcGVjID0gZnVuY3Rpb24gKHNwZWMpIHtcbiAgICB2YXIgY2xvbmUgPSB7fTtcbiAgICBpZiAoc3BlYy5vcGFjaXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY2xvbmUub3BhY2l0eSA9IHNwZWMub3BhY2l0eTtcbiAgICB9XG4gICAgaWYgKHNwZWMuc2l6ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNsb25lLnNpemUgPSBzcGVjLnNpemUuc2xpY2UoMCk7XG4gICAgfVxuICAgIGlmIChzcGVjLnRyYW5zZm9ybSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNsb25lLnRyYW5zZm9ybSA9IHNwZWMudHJhbnNmb3JtLnNsaWNlKDApO1xuICAgIH1cbiAgICBpZiAoc3BlYy5vcmlnaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjbG9uZS5vcmlnaW4gPSBzcGVjLm9yaWdpbi5zbGljZSgwKTtcbiAgICB9XG4gICAgaWYgKHNwZWMuYWxpZ24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjbG9uZS5hbGlnbiA9IHNwZWMuYWxpZ24uc2xpY2UoMCk7XG4gICAgfVxuICAgIHJldHVybiBjbG9uZTtcbn07XG5mdW5jdGlvbiBfaXNFcXVhbEFycmF5KGEsIGIpIHtcbiAgICBpZiAoYSA9PT0gYikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGEgPT09IHVuZGVmaW5lZCB8fCBiID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgaSA9IGEubGVuZ3RoO1xuICAgIGlmIChpICE9PSBiLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbkxheW91dFV0aWxpdHkuaXNFcXVhbFNwZWMgPSBmdW5jdGlvbiAoc3BlYzEsIHNwZWMyKSB7XG4gICAgaWYgKHNwZWMxLm9wYWNpdHkgIT09IHNwZWMyLm9wYWNpdHkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIV9pc0VxdWFsQXJyYXkoc3BlYzEuc2l6ZSwgc3BlYzIuc2l6ZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIV9pc0VxdWFsQXJyYXkoc3BlYzEudHJhbnNmb3JtLCBzcGVjMi50cmFuc2Zvcm0pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFfaXNFcXVhbEFycmF5KHNwZWMxLm9yaWdpbiwgc3BlYzIub3JpZ2luKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghX2lzRXF1YWxBcnJheShzcGVjMS5hbGlnbiwgc3BlYzIuYWxpZ24pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuTGF5b3V0VXRpbGl0eS5nZXRTcGVjRGlmZlRleHQgPSBmdW5jdGlvbiAoc3BlYzEsIHNwZWMyKSB7XG4gICAgdmFyIHJlc3VsdCA9ICdzcGVjIGRpZmY6JztcbiAgICBpZiAoc3BlYzEub3BhY2l0eSAhPT0gc3BlYzIub3BhY2l0eSkge1xuICAgICAgICByZXN1bHQgKz0gJ1xcbm9wYWNpdHk6ICcgKyBzcGVjMS5vcGFjaXR5ICsgJyAhPSAnICsgc3BlYzIub3BhY2l0eTtcbiAgICB9XG4gICAgaWYgKCFfaXNFcXVhbEFycmF5KHNwZWMxLnNpemUsIHNwZWMyLnNpemUpKSB7XG4gICAgICAgIHJlc3VsdCArPSAnXFxuc2l6ZTogJyArIEpTT04uc3RyaW5naWZ5KHNwZWMxLnNpemUpICsgJyAhPSAnICsgSlNPTi5zdHJpbmdpZnkoc3BlYzIuc2l6ZSk7XG4gICAgfVxuICAgIGlmICghX2lzRXF1YWxBcnJheShzcGVjMS50cmFuc2Zvcm0sIHNwZWMyLnRyYW5zZm9ybSkpIHtcbiAgICAgICAgcmVzdWx0ICs9ICdcXG50cmFuc2Zvcm06ICcgKyBKU09OLnN0cmluZ2lmeShzcGVjMS50cmFuc2Zvcm0pICsgJyAhPSAnICsgSlNPTi5zdHJpbmdpZnkoc3BlYzIudHJhbnNmb3JtKTtcbiAgICB9XG4gICAgaWYgKCFfaXNFcXVhbEFycmF5KHNwZWMxLm9yaWdpbiwgc3BlYzIub3JpZ2luKSkge1xuICAgICAgICByZXN1bHQgKz0gJ1xcbm9yaWdpbjogJyArIEpTT04uc3RyaW5naWZ5KHNwZWMxLm9yaWdpbikgKyAnICE9ICcgKyBKU09OLnN0cmluZ2lmeShzcGVjMi5vcmlnaW4pO1xuICAgIH1cbiAgICBpZiAoIV9pc0VxdWFsQXJyYXkoc3BlYzEuYWxpZ24sIHNwZWMyLmFsaWduKSkge1xuICAgICAgICByZXN1bHQgKz0gJ1xcbmFsaWduOiAnICsgSlNPTi5zdHJpbmdpZnkoc3BlYzEuYWxpZ24pICsgJyAhPSAnICsgSlNPTi5zdHJpbmdpZnkoc3BlYzIuYWxpZ24pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbkxheW91dFV0aWxpdHkuZXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIGNvbnNvbGUubG9nKCdFUlJPUjogJyArIG1lc3NhZ2UpO1xuICAgIHRocm93IG1lc3NhZ2U7XG59O1xuTGF5b3V0VXRpbGl0eS53YXJuaW5nID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmxvZygnV0FSTklORzogJyArIG1lc3NhZ2UpO1xufTtcbkxheW91dFV0aWxpdHkubG9nID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICB2YXIgbWVzc2FnZSA9ICcnO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGlmIChhcmcgaW5zdGFuY2VvZiBPYmplY3QgfHwgYXJnIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gSlNPTi5zdHJpbmdpZnkoYXJnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gYXJnO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xufTtcbkxheW91dFV0aWxpdHkuY29tYmluZU9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9uczEsIG9wdGlvbnMyLCBmb3JjZUNsb25lKSB7XG4gICAgaWYgKG9wdGlvbnMxICYmICFvcHRpb25zMiAmJiAhZm9yY2VDbG9uZSkge1xuICAgICAgICByZXR1cm4gb3B0aW9uczE7XG4gICAgfSBlbHNlIGlmICghb3B0aW9uczEgJiYgb3B0aW9uczIgJiYgIWZvcmNlQ2xvbmUpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMyO1xuICAgIH1cbiAgICB2YXIgb3B0aW9ucyA9IFV0aWxpdHkuY2xvbmUob3B0aW9uczEgfHwge30pO1xuICAgIGlmIChvcHRpb25zMikge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb3B0aW9uczIpIHtcbiAgICAgICAgICAgIG9wdGlvbnNba2V5XSA9IG9wdGlvbnMyW2tleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9wdGlvbnM7XG59O1xuTGF5b3V0VXRpbGl0eS5yZWdpc3RlckhlbHBlciA9IGZ1bmN0aW9uIChuYW1lLCBIZWxwZXIpIHtcbiAgICBpZiAoIUhlbHBlci5wcm90b3R5cGUucGFyc2UpIHtcbiAgICAgICAgTGF5b3V0VXRpbGl0eS5lcnJvcignVGhlIGxheW91dC1oZWxwZXIgZm9yIG5hbWUgXCInICsgbmFtZSArICdcIiBpcyByZXF1aXJlZCB0byBzdXBwb3J0IHRoZSBcInBhcnNlXCIgbWV0aG9kJyk7XG4gICAgfVxuICAgIGlmICh0aGlzLnJlZ2lzdGVyZWRIZWxwZXJzW25hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgTGF5b3V0VXRpbGl0eS53YXJuaW5nKCdBIGxheW91dC1oZWxwZXIgd2l0aCB0aGUgbmFtZSBcIicgKyBuYW1lICsgJ1wiIGlzIGFscmVhZHkgcmVnaXN0ZXJlZCBhbmQgd2lsbCBiZSBvdmVyd3JpdHRlbicpO1xuICAgIH1cbiAgICB0aGlzLnJlZ2lzdGVyZWRIZWxwZXJzW25hbWVdID0gSGVscGVyO1xufTtcbkxheW91dFV0aWxpdHkudW5yZWdpc3RlckhlbHBlciA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgZGVsZXRlIHRoaXMucmVnaXN0ZXJlZEhlbHBlcnNbbmFtZV07XG59O1xuTGF5b3V0VXRpbGl0eS5nZXRSZWdpc3RlcmVkSGVscGVyID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5yZWdpc3RlcmVkSGVscGVyc1tuYW1lXTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IExheW91dFV0aWxpdHk7IiwidmFyIExheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuL0xheW91dFV0aWxpdHknKTtcbnZhciBMYXlvdXRDb250cm9sbGVyID0gcmVxdWlyZSgnLi9MYXlvdXRDb250cm9sbGVyJyk7XG52YXIgTGF5b3V0Tm9kZSA9IHJlcXVpcmUoJy4vTGF5b3V0Tm9kZScpO1xudmFyIEZsb3dMYXlvdXROb2RlID0gcmVxdWlyZSgnLi9GbG93TGF5b3V0Tm9kZScpO1xudmFyIExheW91dE5vZGVNYW5hZ2VyID0gcmVxdWlyZSgnLi9MYXlvdXROb2RlTWFuYWdlcicpO1xudmFyIENvbnRhaW5lclN1cmZhY2UgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuc3VyZmFjZXMuQ29udGFpbmVyU3VyZmFjZSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5zdXJmYWNlcy5Db250YWluZXJTdXJmYWNlIDogbnVsbDtcbnZhciBUcmFuc2Zvcm0gPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuY29yZS5UcmFuc2Zvcm0gOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5UcmFuc2Zvcm0gOiBudWxsO1xudmFyIEV2ZW50SGFuZGxlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLkV2ZW50SGFuZGxlciA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLkV2ZW50SGFuZGxlciA6IG51bGw7XG52YXIgR3JvdXAgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuY29yZS5Hcm91cCA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLkdyb3VwIDogbnVsbDtcbnZhciBWZWN0b3IgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMubWF0aC5WZWN0b3IgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMubWF0aC5WZWN0b3IgOiBudWxsO1xudmFyIFBoeXNpY3NFbmdpbmUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMucGh5c2ljcy5QaHlzaWNzRW5naW5lIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnBoeXNpY3MuUGh5c2ljc0VuZ2luZSA6IG51bGw7XG52YXIgUGFydGljbGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMucGh5c2ljcy5ib2RpZXMuUGFydGljbGUgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMucGh5c2ljcy5ib2RpZXMuUGFydGljbGUgOiBudWxsO1xudmFyIERyYWcgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMucGh5c2ljcy5mb3JjZXMuRHJhZyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5waHlzaWNzLmZvcmNlcy5EcmFnIDogbnVsbDtcbnZhciBTcHJpbmcgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMucGh5c2ljcy5mb3JjZXMuU3ByaW5nIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnBoeXNpY3MuZm9yY2VzLlNwcmluZyA6IG51bGw7XG52YXIgU2Nyb2xsU3luYyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5pbnB1dHMuU2Nyb2xsU3luYyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5pbnB1dHMuU2Nyb2xsU3luYyA6IG51bGw7XG52YXIgVmlld1NlcXVlbmNlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuVmlld1NlcXVlbmNlIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuVmlld1NlcXVlbmNlIDogbnVsbDtcbnZhciBCb3VuZHMgPSB7XG4gICAgICAgIE5PTkU6IDAsXG4gICAgICAgIFBSRVY6IDEsXG4gICAgICAgIE5FWFQ6IDIsXG4gICAgICAgIEJPVEg6IDNcbiAgICB9O1xudmFyIFNwcmluZ1NvdXJjZSA9IHtcbiAgICAgICAgTk9ORTogJ25vbmUnLFxuICAgICAgICBORVhUQk9VTkRTOiAnbmV4dC1ib3VuZHMnLFxuICAgICAgICBQUkVWQk9VTkRTOiAncHJldi1ib3VuZHMnLFxuICAgICAgICBNSU5TSVpFOiAnbWluaW1hbC1zaXplJyxcbiAgICAgICAgR09UT1NFUVVFTkNFOiAnZ290by1zZXF1ZW5jZScsXG4gICAgICAgIEVOU1VSRVZJU0lCTEU6ICdlbnN1cmUtdmlzaWJsZScsXG4gICAgICAgIEdPVE9QUkVWRElSRUNUSU9OOiAnZ290by1wcmV2LWRpcmVjdGlvbicsXG4gICAgICAgIEdPVE9ORVhURElSRUNUSU9OOiAnZ290by1uZXh0LWRpcmVjdGlvbicsXG4gICAgICAgIFNOQVBQUkVWOiAnc25hcC1wcmV2JyxcbiAgICAgICAgU05BUE5FWFQ6ICdzbmFwLW5leHQnXG4gICAgfTtcbmZ1bmN0aW9uIFNjcm9sbENvbnRyb2xsZXIob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBMYXlvdXRVdGlsaXR5LmNvbWJpbmVPcHRpb25zKFNjcm9sbENvbnRyb2xsZXIuREVGQVVMVF9PUFRJT05TLCBvcHRpb25zKTtcbiAgICB2YXIgbGF5b3V0TWFuYWdlciA9IG5ldyBMYXlvdXROb2RlTWFuYWdlcihvcHRpb25zLmZsb3cgPyBGbG93TGF5b3V0Tm9kZSA6IExheW91dE5vZGUsIF9pbml0TGF5b3V0Tm9kZS5iaW5kKHRoaXMpKTtcbiAgICBMYXlvdXRDb250cm9sbGVyLmNhbGwodGhpcywgb3B0aW9ucywgbGF5b3V0TWFuYWdlcik7XG4gICAgdGhpcy5fc2Nyb2xsID0ge1xuICAgICAgICBhY3RpdmVUb3VjaGVzOiBbXSxcbiAgICAgICAgcGU6IG5ldyBQaHlzaWNzRW5naW5lKCksXG4gICAgICAgIHBhcnRpY2xlOiBuZXcgUGFydGljbGUodGhpcy5vcHRpb25zLnNjcm9sbFBhcnRpY2xlKSxcbiAgICAgICAgZHJhZ0ZvcmNlOiBuZXcgRHJhZyh0aGlzLm9wdGlvbnMuc2Nyb2xsRHJhZyksXG4gICAgICAgIGZyaWN0aW9uRm9yY2U6IG5ldyBEcmFnKHRoaXMub3B0aW9ucy5zY3JvbGxGcmljdGlvbiksXG4gICAgICAgIHNwcmluZ1ZhbHVlOiB1bmRlZmluZWQsXG4gICAgICAgIHNwcmluZ0ZvcmNlOiBuZXcgU3ByaW5nKHRoaXMub3B0aW9ucy5zY3JvbGxTcHJpbmcpLFxuICAgICAgICBzcHJpbmdFbmRTdGF0ZTogbmV3IFZlY3RvcihbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSksXG4gICAgICAgIGdyb3VwU3RhcnQ6IDAsXG4gICAgICAgIGdyb3VwVHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgc2Nyb2xsRGVsdGE6IDAsXG4gICAgICAgIG5vcm1hbGl6ZWRTY3JvbGxEZWx0YTogMCxcbiAgICAgICAgc2Nyb2xsRm9yY2U6IDAsXG4gICAgICAgIHNjcm9sbEZvcmNlQ291bnQ6IDAsXG4gICAgICAgIHVubm9ybWFsaXplZFNjcm9sbE9mZnNldDogMCxcbiAgICAgICAgaXNTY3JvbGxpbmc6IGZhbHNlXG4gICAgfTtcbiAgICB0aGlzLl9kZWJ1ZyA9IHtcbiAgICAgICAgbGF5b3V0Q291bnQ6IDAsXG4gICAgICAgIGNvbW1pdENvdW50OiAwXG4gICAgfTtcbiAgICB0aGlzLmdyb3VwID0gbmV3IEdyb3VwKCk7XG4gICAgdGhpcy5ncm91cC5hZGQoeyByZW5kZXI6IF9pbm5lclJlbmRlci5iaW5kKHRoaXMpIH0pO1xuICAgIHRoaXMuX3Njcm9sbC5wZS5hZGRCb2R5KHRoaXMuX3Njcm9sbC5wYXJ0aWNsZSk7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuc2Nyb2xsRHJhZy5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLl9zY3JvbGwuZHJhZ0ZvcmNlSWQgPSB0aGlzLl9zY3JvbGwucGUuYXR0YWNoKHRoaXMuX3Njcm9sbC5kcmFnRm9yY2UsIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZSk7XG4gICAgfVxuICAgIGlmICghdGhpcy5vcHRpb25zLnNjcm9sbEZyaWN0aW9uLmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5mcmljdGlvbkZvcmNlSWQgPSB0aGlzLl9zY3JvbGwucGUuYXR0YWNoKHRoaXMuX3Njcm9sbC5mcmljdGlvbkZvcmNlLCB0aGlzLl9zY3JvbGwucGFydGljbGUpO1xuICAgIH1cbiAgICB0aGlzLl9zY3JvbGwuc3ByaW5nRm9yY2Uuc2V0T3B0aW9ucyh7IGFuY2hvcjogdGhpcy5fc2Nyb2xsLnNwcmluZ0VuZFN0YXRlIH0pO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQub24oJ3RvdWNoc3RhcnQnLCBfdG91Y2hTdGFydC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl9ldmVudElucHV0Lm9uKCd0b3VjaG1vdmUnLCBfdG91Y2hNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQub24oJ3RvdWNoZW5kJywgX3RvdWNoRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQub24oJ3RvdWNoY2FuY2VsJywgX3RvdWNoRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQub24oJ21vdXNlZG93bicsIF9tb3VzZURvd24uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5fZXZlbnRJbnB1dC5vbignbW91c2V1cCcsIF9tb3VzZVVwLmJpbmQodGhpcykpO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQub24oJ21vdXNlbW92ZScsIF9tb3VzZU1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5fc2Nyb2xsU3luYyA9IG5ldyBTY3JvbGxTeW5jKHRoaXMub3B0aW9ucy5zY3JvbGxTeW5jKTtcbiAgICB0aGlzLl9ldmVudElucHV0LnBpcGUodGhpcy5fc2Nyb2xsU3luYyk7XG4gICAgdGhpcy5fc2Nyb2xsU3luYy5vbigndXBkYXRlJywgX3Njcm9sbFVwZGF0ZS5iaW5kKHRoaXMpKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnVzZUNvbnRhaW5lcikge1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IG5ldyBDb250YWluZXJTdXJmYWNlKHRoaXMub3B0aW9ucy5jb250YWluZXIpO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGQoe1xuICAgICAgICAgICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgICAgICAgICB9LmJpbmQodGhpcylcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmF1dG9QaXBlRXZlbnRzKSB7XG4gICAgICAgICAgICB0aGlzLnN1YnNjcmliZSh0aGlzLmNvbnRhaW5lcik7XG4gICAgICAgICAgICBFdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKHRoaXMuY29udGFpbmVyLCB0aGlzKTtcbiAgICAgICAgICAgIEV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKHRoaXMuY29udGFpbmVyLCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShMYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZSk7XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFNjcm9sbENvbnRyb2xsZXI7XG5TY3JvbGxDb250cm9sbGVyLkJvdW5kcyA9IEJvdW5kcztcblNjcm9sbENvbnRyb2xsZXIuREVGQVVMVF9PUFRJT05TID0ge1xuICAgIGZsb3c6IGZhbHNlLFxuICAgIHVzZUNvbnRhaW5lcjogZmFsc2UsXG4gICAgY29udGFpbmVyOiB7IHByb3BlcnRpZXM6IHsgb3ZlcmZsb3c6ICdoaWRkZW4nIH0gfSxcbiAgICB2aXNpYmxlSXRlbVRocmVzc2hvbGQ6IDAuNSxcbiAgICBzY3JvbGxQYXJ0aWNsZToge30sXG4gICAgc2Nyb2xsRHJhZzoge1xuICAgICAgICBmb3JjZUZ1bmN0aW9uOiBEcmFnLkZPUkNFX0ZVTkNUSU9OUy5RVUFEUkFUSUMsXG4gICAgICAgIHN0cmVuZ3RoOiAwLjAwMSxcbiAgICAgICAgZGlzYWJsZWQ6IHRydWVcbiAgICB9LFxuICAgIHNjcm9sbEZyaWN0aW9uOiB7XG4gICAgICAgIGZvcmNlRnVuY3Rpb246IERyYWcuRk9SQ0VfRlVOQ1RJT05TLkxJTkVBUixcbiAgICAgICAgc3RyZW5ndGg6IDAuMDAyNSxcbiAgICAgICAgZGlzYWJsZWQ6IGZhbHNlXG4gICAgfSxcbiAgICBzY3JvbGxTcHJpbmc6IHtcbiAgICAgICAgZGFtcGluZ1JhdGlvOiAxLFxuICAgICAgICBwZXJpb2Q6IDM1MFxuICAgIH0sXG4gICAgc2Nyb2xsU3luYzogeyBzY2FsZTogMC4yIH0sXG4gICAgcGFnaW5hdGVkOiBmYWxzZSxcbiAgICBwYWdpbmF0aW9uRW5lcmd5VGhyZXNzaG9sZDogMC4wMDUsXG4gICAgYWxpZ25tZW50OiAwLFxuICAgIHRvdWNoTW92ZURpcmVjdGlvblRocmVzc2hvbGQ6IHVuZGVmaW5lZCxcbiAgICBtb3VzZU1vdmU6IGZhbHNlLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgbGF5b3V0QWxsOiBmYWxzZSxcbiAgICBhbHdheXNMYXlvdXQ6IGZhbHNlLFxuICAgIGV4dHJhQm91bmRzU3BhY2U6IFtcbiAgICAgICAgMTAwLFxuICAgICAgICAxMDBcbiAgICBdLFxuICAgIGRlYnVnOiBmYWxzZVxufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIExheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnNldE9wdGlvbnMuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICBpZiAodGhpcy5fc2Nyb2xsKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnNjcm9sbFNwcmluZykge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlLnNldE9wdGlvbnMob3B0aW9ucy5zY3JvbGxTcHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLnNjcm9sbERyYWcpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5kcmFnRm9yY2Uuc2V0T3B0aW9ucyhvcHRpb25zLnNjcm9sbERyYWcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChvcHRpb25zLnNjcm9sbFN5bmMgJiYgdGhpcy5fc2Nyb2xsU3luYykge1xuICAgICAgICB0aGlzLl9zY3JvbGxTeW5jLnNldE9wdGlvbnMob3B0aW9ucy5zY3JvbGxTeW5jKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuZnVuY3Rpb24gX2luaXRMYXlvdXROb2RlKG5vZGUsIHNwZWMpIHtcbiAgICBpZiAoIXNwZWMgJiYgdGhpcy5vcHRpb25zLmluc2VydFNwZWMpIHtcbiAgICAgICAgbm9kZS5zZXRTcGVjKHRoaXMub3B0aW9ucy5pbnNlcnRTcGVjKTtcbiAgICB9XG59XG5mdW5jdGlvbiBfbG9nKGFyZ3MpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kZWJ1Zykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBtZXNzYWdlID0gdGhpcy5fZGVidWcuY29tbWl0Q291bnQgKyAnOiAnO1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICB2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBpZiAoYXJnIGluc3RhbmNlb2YgT2JqZWN0IHx8IGFyZyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9IEpTT04uc3RyaW5naWZ5KGFyZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9IGFyZztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbn1cbmZ1bmN0aW9uIF91cGRhdGVTcHJpbmcoKSB7XG4gICAgdmFyIHNwcmluZ1ZhbHVlID0gdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQgPyB1bmRlZmluZWQgOiB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb247XG4gICAgaWYgKHRoaXMuX3Njcm9sbC5zcHJpbmdWYWx1ZSAhPT0gc3ByaW5nVmFsdWUpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1ZhbHVlID0gc3ByaW5nVmFsdWU7XG4gICAgICAgIGlmIChzcHJpbmdWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlSWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5wZS5kZXRhY2godGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlSWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdGb3JjZUlkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3Njcm9sbC5zcHJpbmdGb3JjZUlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nRm9yY2VJZCA9IHRoaXMuX3Njcm9sbC5wZS5hdHRhY2godGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlLCB0aGlzLl9zY3JvbGwucGFydGljbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ0VuZFN0YXRlLnNldDFEKHNwcmluZ1ZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5wZS53YWtlKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBfbW91c2VEb3duKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubW91c2VNb3ZlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUpIHtcbiAgICAgICAgdGhpcy5yZWxlYXNlU2Nyb2xsRm9yY2UodGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5kZWx0YSk7XG4gICAgfVxuICAgIHZhciBjdXJyZW50ID0gW1xuICAgICAgICAgICAgZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIGV2ZW50LmNsaWVudFlcbiAgICAgICAgXTtcbiAgICB2YXIgdGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZSA9IHtcbiAgICAgICAgZGVsdGE6IDAsXG4gICAgICAgIHN0YXJ0OiBjdXJyZW50LFxuICAgICAgICBjdXJyZW50OiBjdXJyZW50LFxuICAgICAgICBwcmV2OiBjdXJyZW50LFxuICAgICAgICB0aW1lOiB0aW1lLFxuICAgICAgICBwcmV2VGltZTogdGltZVxuICAgIH07XG4gICAgdGhpcy5hcHBseVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuZGVsdGEpO1xufVxuZnVuY3Rpb24gX21vdXNlTW92ZShldmVudCkge1xuICAgIGlmICghdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZSB8fCAhdGhpcy5vcHRpb25zLmVuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbW92ZURpcmVjdGlvbiA9IE1hdGguYXRhbjIoTWF0aC5hYnMoZXZlbnQuY2xpZW50WSAtIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUucHJldlsxXSksIE1hdGguYWJzKGV2ZW50LmNsaWVudFggLSB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnByZXZbMF0pKSAvIChNYXRoLlBJIC8gMik7XG4gICAgdmFyIGRpcmVjdGlvbkRpZmYgPSBNYXRoLmFicyh0aGlzLl9kaXJlY3Rpb24gLSBtb3ZlRGlyZWN0aW9uKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRvdWNoTW92ZURpcmVjdGlvblRocmVzc2hvbGQgPT09IHVuZGVmaW5lZCB8fCBkaXJlY3Rpb25EaWZmIDw9IHRoaXMub3B0aW9ucy50b3VjaE1vdmVEaXJlY3Rpb25UaHJlc3Nob2xkKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUucHJldiA9IHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuY3VycmVudDtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5jdXJyZW50ID0gW1xuICAgICAgICAgICAgZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIGV2ZW50LmNsaWVudFlcbiAgICAgICAgXTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5wcmV2VGltZSA9IHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUudGltZTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5kaXJlY3Rpb24gPSBtb3ZlRGlyZWN0aW9uO1xuICAgICAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cbiAgICB2YXIgZGVsdGEgPSB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLmN1cnJlbnRbdGhpcy5fZGlyZWN0aW9uXSAtIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuc3RhcnRbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICB0aGlzLnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuZGVsdGEsIGRlbHRhKTtcbiAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLmRlbHRhID0gZGVsdGE7XG59XG5mdW5jdGlvbiBfbW91c2VVcChldmVudCkge1xuICAgIGlmICghdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB2ZWxvY2l0eSA9IDA7XG4gICAgdmFyIGRpZmZUaW1lID0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS50aW1lIC0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5wcmV2VGltZTtcbiAgICBpZiAoZGlmZlRpbWUgPiAwKSB7XG4gICAgICAgIHZhciBkaWZmT2Zmc2V0ID0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5jdXJyZW50W3RoaXMuX2RpcmVjdGlvbl0gLSB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnByZXZbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICAgICAgdmVsb2NpdHkgPSBkaWZmT2Zmc2V0IC8gZGlmZlRpbWU7XG4gICAgfVxuICAgIHRoaXMucmVsZWFzZVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuZGVsdGEsIHZlbG9jaXR5KTtcbiAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlID0gdW5kZWZpbmVkO1xufVxuZnVuY3Rpb24gX3RvdWNoU3RhcnQoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMuX3RvdWNoRW5kRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl90b3VjaEVuZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuX3RvdWNoRW5kRXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICBfdG91Y2hFbmQuY2FsbCh0aGlzLCBldmVudCk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICB9XG4gICAgdmFyIG9sZFRvdWNoZXNDb3VudCA9IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aDtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGo7XG4gICAgdmFyIHRvdWNoRm91bmQ7XG4gICAgd2hpbGUgKGkgPCB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGFjdGl2ZVRvdWNoID0gdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXNbaV07XG4gICAgICAgIHRvdWNoRm91bmQgPSBmYWxzZTtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGV2ZW50LnRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciB0b3VjaCA9IGV2ZW50LnRvdWNoZXNbal07XG4gICAgICAgICAgICBpZiAodG91Y2guaWRlbnRpZmllciA9PT0gYWN0aXZlVG91Y2guaWQpIHtcbiAgICAgICAgICAgICAgICB0b3VjaEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvdWNoRm91bmQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZXZlbnQudG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhbmdlZFRvdWNoID0gZXZlbnQudG91Y2hlc1tpXTtcbiAgICAgICAgdG91Y2hGb3VuZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlc1tqXS5pZCA9PT0gY2hhbmdlZFRvdWNoLmlkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICB0b3VjaEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvdWNoRm91bmQpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gW1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkVG91Y2guY2xpZW50WCxcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlZFRvdWNoLmNsaWVudFlcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgdmFyIHRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgaWQ6IGNoYW5nZWRUb3VjaC5pZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBjdXJyZW50LFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IGN1cnJlbnQsXG4gICAgICAgICAgICAgICAgcHJldjogY3VycmVudCxcbiAgICAgICAgICAgICAgICB0aW1lOiB0aW1lLFxuICAgICAgICAgICAgICAgIHByZXZUaW1lOiB0aW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNoYW5nZWRUb3VjaC50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl90b3VjaEVuZEV2ZW50TGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghb2xkVG91Y2hlc0NvdW50ICYmIHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmFwcGx5U2Nyb2xsRm9yY2UoMCk7XG4gICAgICAgIHRoaXMuX3Njcm9sbC50b3VjaERlbHRhID0gMDtcbiAgICB9XG59XG5mdW5jdGlvbiBfdG91Y2hNb3ZlKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBwcmltYXJ5VG91Y2g7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhbmdlZFRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbaV07XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciB0b3VjaCA9IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzW2pdO1xuICAgICAgICAgICAgaWYgKHRvdWNoLmlkID09PSBjaGFuZ2VkVG91Y2guaWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgIHZhciBtb3ZlRGlyZWN0aW9uID0gTWF0aC5hdGFuMihNYXRoLmFicyhjaGFuZ2VkVG91Y2guY2xpZW50WSAtIHRvdWNoLnByZXZbMV0pLCBNYXRoLmFicyhjaGFuZ2VkVG91Y2guY2xpZW50WCAtIHRvdWNoLnByZXZbMF0pKSAvIChNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbkRpZmYgPSBNYXRoLmFicyh0aGlzLl9kaXJlY3Rpb24gLSBtb3ZlRGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRvdWNoTW92ZURpcmVjdGlvblRocmVzc2hvbGQgPT09IHVuZGVmaW5lZCB8fCBkaXJlY3Rpb25EaWZmIDw9IHRoaXMub3B0aW9ucy50b3VjaE1vdmVEaXJlY3Rpb25UaHJlc3Nob2xkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoLnByZXYgPSB0b3VjaC5jdXJyZW50O1xuICAgICAgICAgICAgICAgICAgICB0b3VjaC5jdXJyZW50ID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlZFRvdWNoLmNsaWVudFgsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkVG91Y2guY2xpZW50WVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICB0b3VjaC5wcmV2VGltZSA9IHRvdWNoLnRpbWU7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoLmRpcmVjdGlvbiA9IG1vdmVEaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoLnRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICBwcmltYXJ5VG91Y2ggPSBqID09PSAwID8gdG91Y2ggOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChwcmltYXJ5VG91Y2gpIHtcbiAgICAgICAgdmFyIGRlbHRhID0gcHJpbWFyeVRvdWNoLmN1cnJlbnRbdGhpcy5fZGlyZWN0aW9uXSAtIHByaW1hcnlUb3VjaC5zdGFydFt0aGlzLl9kaXJlY3Rpb25dO1xuICAgICAgICB0aGlzLnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC50b3VjaERlbHRhLCBkZWx0YSk7XG4gICAgICAgIHRoaXMuX3Njcm9sbC50b3VjaERlbHRhID0gZGVsdGE7XG4gICAgfVxufVxuZnVuY3Rpb24gX3RvdWNoRW5kKGV2ZW50KSB7XG4gICAgdmFyIHByaW1hcnlUb3VjaCA9IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aCA/IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzWzBdIDogdW5kZWZpbmVkO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoYW5nZWRUb3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzW2ldO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgdG91Y2ggPSB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlc1tqXTtcbiAgICAgICAgICAgIGlmICh0b3VjaC5pZCA9PT0gY2hhbmdlZFRvdWNoLmlkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlcy5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKGogPT09IDAgJiYgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdQcmltYXJ5VG91Y2ggPSB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UHJpbWFyeVRvdWNoLnN0YXJ0WzBdID0gbmV3UHJpbWFyeVRvdWNoLmN1cnJlbnRbMF0gLSAodG91Y2guY3VycmVudFswXSAtIHRvdWNoLnN0YXJ0WzBdKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UHJpbWFyeVRvdWNoLnN0YXJ0WzFdID0gbmV3UHJpbWFyeVRvdWNoLmN1cnJlbnRbMV0gLSAodG91Y2guY3VycmVudFsxXSAtIHRvdWNoLnN0YXJ0WzFdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFwcmltYXJ5VG91Y2ggfHwgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHZlbG9jaXR5ID0gMDtcbiAgICB2YXIgZGlmZlRpbWUgPSBwcmltYXJ5VG91Y2gudGltZSAtIHByaW1hcnlUb3VjaC5wcmV2VGltZTtcbiAgICBpZiAoZGlmZlRpbWUgPiAwKSB7XG4gICAgICAgIHZhciBkaWZmT2Zmc2V0ID0gcHJpbWFyeVRvdWNoLmN1cnJlbnRbdGhpcy5fZGlyZWN0aW9uXSAtIHByaW1hcnlUb3VjaC5wcmV2W3RoaXMuX2RpcmVjdGlvbl07XG4gICAgICAgIHZlbG9jaXR5ID0gZGlmZk9mZnNldCAvIGRpZmZUaW1lO1xuICAgIH1cbiAgICB2YXIgZGVsdGEgPSB0aGlzLl9zY3JvbGwudG91Y2hEZWx0YTtcbiAgICB0aGlzLnJlbGVhc2VTY3JvbGxGb3JjZShkZWx0YSwgdmVsb2NpdHkpO1xuICAgIHRoaXMuX3Njcm9sbC50b3VjaERlbHRhID0gMDtcbn1cbmZ1bmN0aW9uIF9zY3JvbGxVcGRhdGUoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5lbmFibGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG9mZnNldCA9IEFycmF5LmlzQXJyYXkoZXZlbnQuZGVsdGEpID8gZXZlbnQuZGVsdGFbdGhpcy5fZGlyZWN0aW9uXSA6IGV2ZW50LmRlbHRhO1xuICAgIHRoaXMuc2Nyb2xsKG9mZnNldCk7XG59XG5mdW5jdGlvbiBfc2V0UGFydGljbGUocG9zaXRpb24sIHZlbG9jaXR5LCBwaGFzZSkge1xuICAgIGlmIChwb3NpdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZVZhbHVlID0gcG9zaXRpb247XG4gICAgICAgIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZS5zZXRQb3NpdGlvbjFEKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgaWYgKHZlbG9jaXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIG9sZFZlbG9jaXR5ID0gdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLmdldFZlbG9jaXR5MUQoKTtcbiAgICAgICAgaWYgKG9sZFZlbG9jaXR5ICE9PSB2ZWxvY2l0eSkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLnNldFZlbG9jaXR5MUQodmVsb2NpdHkpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gX2NhbGNTY3JvbGxPZmZzZXQobm9ybWFsaXplLCByZWZyZXNoUGFydGljbGUpIHtcbiAgICBpZiAocmVmcmVzaFBhcnRpY2xlIHx8IHRoaXMuX3Njcm9sbC5wYXJ0aWNsZVZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnBhcnRpY2xlVmFsdWUgPSB0aGlzLl9zY3JvbGwucGFydGljbGUuZ2V0UG9zaXRpb24xRCgpO1xuICAgICAgICB0aGlzLl9zY3JvbGwucGFydGljbGVWYWx1ZSA9IE1hdGgucm91bmQodGhpcy5fc2Nyb2xsLnBhcnRpY2xlVmFsdWUgKiAxMDAwKSAvIDEwMDA7XG4gICAgfVxuICAgIHZhciBzY3JvbGxPZmZzZXQgPSB0aGlzLl9zY3JvbGwucGFydGljbGVWYWx1ZTtcbiAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbERlbHRhIHx8IHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGEpIHtcbiAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IHRoaXMuX3Njcm9sbC5zY3JvbGxEZWx0YSArIHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGE7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCAmIEJvdW5kcy5QUkVWICYmIHNjcm9sbE9mZnNldCA+IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiB8fCB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCAmIEJvdW5kcy5ORVhUICYmIHNjcm9sbE9mZnNldCA8IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiB8fCB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9PT0gQm91bmRzLkJPVEgpIHtcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldCA9IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9ybWFsaXplKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3Njcm9sbC5zY3JvbGxEZWx0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGEgPSAwO1xuICAgICAgICAgICAgICAgIF9zZXRQYXJ0aWNsZS5jYWxsKHRoaXMsIHNjcm9sbE9mZnNldCwgdW5kZWZpbmVkLCAnX2NhbGNTY3JvbGxPZmZzZXQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGEgKz0gdGhpcy5fc2Nyb2xsLnNjcm9sbERlbHRhO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNjcm9sbERlbHRhID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQgJiYgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ID0gKHNjcm9sbE9mZnNldCArIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZSArIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbikgLyAyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2Nyb2xsT2Zmc2V0O1xufVxuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuX2NhbGNTY3JvbGxIZWlnaHQgPSBmdW5jdGlvbiAobmV4dCkge1xuICAgIHZhciBjYWxjZWRIZWlnaHQgPSAwO1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZShuZXh0KTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAobm9kZS5faW52YWxpZGF0ZWQpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnRydWVTaXplUmVxdWVzdGVkKSB7XG4gICAgICAgICAgICAgICAgY2FsY2VkSGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vZGUuc2Nyb2xsTGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjYWxjZWRIZWlnaHQgKz0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5leHQgPyBub2RlLl9uZXh0IDogbm9kZS5fcHJldjtcbiAgICB9XG4gICAgcmV0dXJuIGNhbGNlZEhlaWdodDtcbn07XG5mdW5jdGlvbiBfY2FsY0JvdW5kcyhzaXplLCBzY3JvbGxPZmZzZXQpIHtcbiAgICB2YXIgcHJldkhlaWdodCA9IHRoaXMuX2NhbGNTY3JvbGxIZWlnaHQoZmFsc2UpO1xuICAgIHZhciBuZXh0SGVpZ2h0ID0gdGhpcy5fY2FsY1Njcm9sbEhlaWdodCh0cnVlKTtcbiAgICBpZiAocHJldkhlaWdodCA9PT0gdW5kZWZpbmVkIHx8IG5leHRIZWlnaHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5OT05FO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuTk9ORTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdG90YWxIZWlnaHQ7XG4gICAgaWYgKG5leHRIZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBwcmV2SGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdG90YWxIZWlnaHQgPSBwcmV2SGVpZ2h0ICsgbmV4dEhlaWdodDtcbiAgICB9XG4gICAgaWYgKHRvdGFsSGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgdG90YWxIZWlnaHQgPD0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkID0gQm91bmRzLkJPVEg7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPyAtbmV4dEhlaWdodCA6IHByZXZIZWlnaHQ7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuTUlOU0laRTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICBpZiAobmV4dEhlaWdodCAhPT0gdW5kZWZpbmVkICYmIHNjcm9sbE9mZnNldCArIG5leHRIZWlnaHQgPD0gMCkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmJvdW5kc1JlYWNoZWQgPSBCb3VuZHMuTkVYVDtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IC1uZXh0SGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5ORVhUQk9VTkRTO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHByZXZIZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBzY3JvbGxPZmZzZXQgLSBwcmV2SGVpZ2h0ID49IDApIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkID0gQm91bmRzLlBSRVY7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5QUkVWQk9VTkRTO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgIGlmIChwcmV2SGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgc2Nyb2xsT2Zmc2V0IC0gcHJldkhlaWdodCA+PSAtc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5QUkVWO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gLXNpemVbdGhpcy5fZGlyZWN0aW9uXSArIHByZXZIZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLlBSRVZCT1VORFM7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobmV4dEhlaWdodCAhPT0gdW5kZWZpbmVkICYmIHNjcm9sbE9mZnNldCArIG5leHRIZWlnaHQgPD0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5ORVhUO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dIC0gbmV4dEhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuTkVYVEJPVU5EUztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5OT05FO1xuICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLk5PTkU7XG59XG5mdW5jdGlvbiBfY2FsY1Njcm9sbFRvT2Zmc2V0KHNpemUsIHNjcm9sbE9mZnNldCkge1xuICAgIHZhciBzY3JvbGxUb1JlbmRlck5vZGUgPSB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9SZW5kZXJOb2RlIHx8IHRoaXMuX3Njcm9sbC5lbnN1cmVWaXNpYmxlUmVuZGVyTm9kZTtcbiAgICBpZiAoIXNjcm9sbFRvUmVuZGVyTm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9PT0gQm91bmRzLkJPVEggfHwgIXRoaXMuX3Njcm9sbC5zY3JvbGxUb0RpcmVjdGlvbiAmJiB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9PT0gQm91bmRzLlBSRVYgfHwgdGhpcy5fc2Nyb2xsLnNjcm9sbFRvRGlyZWN0aW9uICYmIHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkID09PSBCb3VuZHMuTkVYVCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBmb3VuZE5vZGU7XG4gICAgdmFyIHNjcm9sbFRvT2Zmc2V0ID0gMDtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX25vZGVzLmdldFN0YXJ0RW51bU5vZGUodHJ1ZSk7XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBjb3VudCsrO1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkIHx8IG5vZGUuc2Nyb2xsTGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICBzY3JvbGxUb09mZnNldCAtPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5yZW5kZXJOb2RlID09PSBzY3JvbGxUb1JlbmRlck5vZGUpIHtcbiAgICAgICAgICAgIGZvdW5kTm9kZSA9IG5vZGU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgIHNjcm9sbFRvT2Zmc2V0IC09IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICBpZiAoIWZvdW5kTm9kZSkge1xuICAgICAgICBzY3JvbGxUb09mZnNldCA9IDA7XG4gICAgICAgIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKGZhbHNlKTtcbiAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQgfHwgbm9kZS5zY3JvbGxMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsVG9PZmZzZXQgKz0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZS5yZW5kZXJOb2RlID09PSBzY3JvbGxUb1JlbmRlck5vZGUpIHtcbiAgICAgICAgICAgICAgICBmb3VuZE5vZGUgPSBub2RlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxUb09mZnNldCArPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBub2RlLl9wcmV2O1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChmb3VuZE5vZGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3Njcm9sbC5lbnN1cmVWaXNpYmxlU2VxdWVuY2UpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcm9sbFRvT2Zmc2V0IC0gZm91bmROb2RlLnNjcm9sbExlbmd0aCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2Nyb2xsVG9PZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuRU5TVVJFVklTSUJMRTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNjcm9sbFRvT2Zmc2V0ID4gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHNpemVbdGhpcy5fZGlyZWN0aW9uXSAtIHNjcm9sbFRvT2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLkVOU1VSRVZJU0lCTEU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmVuc3VyZVZpc2libGVSZW5kZXJOb2RlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsVG9PZmZzZXQgPSAtc2Nyb2xsVG9PZmZzZXQ7XG4gICAgICAgICAgICAgICAgaWYgKHNjcm9sbFRvT2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSBzY3JvbGxUb09mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5FTlNVUkVWSVNJQkxFO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2Nyb2xsVG9PZmZzZXQgKyBmb3VuZE5vZGUuc2Nyb2xsTGVuZ3RoID4gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHNpemVbdGhpcy5fZGlyZWN0aW9uXSAtIChzY3JvbGxUb09mZnNldCArIGZvdW5kTm9kZS5zY3JvbGxMZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLkVOU1VSRVZJU0lCTEU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmVuc3VyZVZpc2libGVSZW5kZXJOb2RlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHNjcm9sbFRvT2Zmc2V0O1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5HT1RPU0VRVUVOQ0U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbFRvRGlyZWN0aW9uKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHNjcm9sbE9mZnNldCAtIHNpemVbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5HT1RPUFJFVkRJUkVDVElPTjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSBzY3JvbGxPZmZzZXQgKyBzaXplW3RoaXMuX2RpcmVjdGlvbl07XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuR09UT05FWFRESVJFQ1RJT047XG4gICAgfVxufVxuZnVuY3Rpb24gX3NuYXBUb1BhZ2Uoc2l6ZSwgc2Nyb2xsT2Zmc2V0KSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMucGFnaW5hdGVkIHx8IHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZUNvdW50IHx8IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHBhZ2VPZmZzZXQgPSBzY3JvbGxPZmZzZXQ7XG4gICAgdmFyIHBhZ2VMZW5ndGg7XG4gICAgdmFyIGhhc05leHQ7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKGZhbHNlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5zY3JvbGxMZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgIGlmIChwYWdlT2Zmc2V0IDw9IDAgfHwgbm9kZS5zY3JvbGxMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGFzTmV4dCA9IHBhZ2VMZW5ndGggIT09IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHBhZ2VMZW5ndGggPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIHBhZ2VPZmZzZXQgLT0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX3ByZXY7XG4gICAgfVxuICAgIGlmIChwYWdlTGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbm9kZSA9IHRoaXMuX25vZGVzLmdldFN0YXJ0RW51bU5vZGUodHJ1ZSk7XG4gICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZS5zY3JvbGxMZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5zY3JvbGxMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaGFzTmV4dCA9IHBhZ2VMZW5ndGggIT09IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBpZiAoaGFzTmV4dCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFnZU9mZnNldCArIHBhZ2VMZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwYWdlT2Zmc2V0ICs9IHBhZ2VMZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhZ2VMZW5ndGggPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghcGFnZUxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBmbGlwVG9QcmV2O1xuICAgIHZhciBmbGlwVG9OZXh0O1xuICAgIGlmICh0aGlzLm9wdGlvbnMucGFnaW5hdGlvbkVuZXJneVRocmVzc2hvbGQgJiYgTWF0aC5hYnModGhpcy5fc2Nyb2xsLnBhcnRpY2xlLmdldEVuZXJneSgpKSA+PSB0aGlzLm9wdGlvbnMucGFnaW5hdGlvbkVuZXJneVRocmVzc2hvbGQpIHtcbiAgICAgICAgdmFyIHZlbG9jaXR5ID0gdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLmdldFZlbG9jaXR5MUQoKTtcbiAgICAgICAgZmxpcFRvUHJldiA9IHZlbG9jaXR5ID4gMDtcbiAgICAgICAgZmxpcFRvTmV4dCA9IHZlbG9jaXR5IDwgMDtcbiAgICB9XG4gICAgdmFyIGJvdW5kT2Zmc2V0ID0gcGFnZU9mZnNldDtcbiAgICB2YXIgc25hcFNwcmluZ1Bvc2l0aW9uO1xuICAgIGlmICghaGFzTmV4dCB8fCBmbGlwVG9QcmV2IHx8ICFmbGlwVG9OZXh0ICYmIE1hdGguYWJzKGJvdW5kT2Zmc2V0KSA8IE1hdGguYWJzKGJvdW5kT2Zmc2V0ICsgcGFnZUxlbmd0aCkpIHtcbiAgICAgICAgc25hcFNwcmluZ1Bvc2l0aW9uID0gc2Nyb2xsT2Zmc2V0IC0gcGFnZU9mZnNldCAtICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID8gcGFnZUxlbmd0aCA6IDApO1xuICAgICAgICBpZiAoc25hcFNwcmluZ1Bvc2l0aW9uICE9PSB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHNuYXBTcHJpbmdQb3NpdGlvbjtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuU05BUFBSRVY7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBzbmFwU3ByaW5nUG9zaXRpb24gPSBzY3JvbGxPZmZzZXQgLSAocGFnZU9mZnNldCArIHBhZ2VMZW5ndGgpO1xuICAgICAgICBpZiAoc25hcFNwcmluZ1Bvc2l0aW9uICE9PSB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHNuYXBTcHJpbmdQb3NpdGlvbjtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuU05BUE5FWFQ7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBfbm9ybWFsaXplUHJldlZpZXdTZXF1ZW5jZShzaXplLCBzY3JvbGxPZmZzZXQpIHtcbiAgICB2YXIgY291bnQgPSAwO1xuICAgIHZhciBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0O1xuICAgIHZhciBub3JtYWxpemVOZXh0UHJldiA9IGZhbHNlO1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZShmYWxzZSk7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlLl9pbnZhbGlkYXRlZCB8fCAhbm9kZS5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9ybWFsaXplTmV4dFByZXYpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZpZXdTZXF1ZW5jZSA9IG5vZGUuX3ZpZXdTZXF1ZW5jZTtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQ7XG4gICAgICAgICAgICBub3JtYWxpemVOZXh0UHJldiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IG5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQgfHwgc2Nyb2xsT2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc2Nyb2xsT2Zmc2V0IC09IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICBjb3VudCsrO1xuICAgICAgICBpZiAobm9kZS5zY3JvbGxMZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgbm9ybWFsaXplTmV4dFByZXYgPSBzY3JvbGxPZmZzZXQgPj0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdmlld1NlcXVlbmNlID0gbm9kZS5fdmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX3ByZXY7XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0O1xufVxuZnVuY3Rpb24gX25vcm1hbGl6ZU5leHRWaWV3U2VxdWVuY2Uoc2l6ZSwgc2Nyb2xsT2Zmc2V0KSB7XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICB2YXIgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IHNjcm9sbE9mZnNldDtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX25vZGVzLmdldFN0YXJ0RW51bU5vZGUodHJ1ZSk7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlLl9pbnZhbGlkYXRlZCB8fCBub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IG5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQgfHwgIW5vZGUuX3ZpZXdTZXF1ZW5jZSB8fCBzY3JvbGxPZmZzZXQgPiAwICYmICghdGhpcy5vcHRpb25zLmFsaWdubWVudCB8fCBub2RlLnNjcm9sbExlbmd0aCAhPT0gMCkpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICBzY3JvbGxPZmZzZXQgKz0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLnNjcm9sbExlbmd0aCB8fCB0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSBub2RlLl92aWV3U2VxdWVuY2U7XG4gICAgICAgICAgICBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG4gICAgcmV0dXJuIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQ7XG59XG5mdW5jdGlvbiBfbm9ybWFsaXplVmlld1NlcXVlbmNlKHNpemUsIHNjcm9sbE9mZnNldCkge1xuICAgIHZhciBjYXBzID0gdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcztcbiAgICBpZiAoY2FwcyAmJiBjYXBzLmRlYnVnICYmIGNhcHMuZGVidWcubm9ybWFsaXplICE9PSB1bmRlZmluZWQgJiYgIWNhcHMuZGVidWcubm9ybWFsaXplKSB7XG4gICAgICAgIHJldHVybiBzY3JvbGxPZmZzZXQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCkge1xuICAgICAgICByZXR1cm4gc2Nyb2xsT2Zmc2V0O1xuICAgIH1cbiAgICB2YXIgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IHNjcm9sbE9mZnNldDtcbiAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCAmJiBzY3JvbGxPZmZzZXQgPCAwKSB7XG4gICAgICAgIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBfbm9ybWFsaXplTmV4dFZpZXdTZXF1ZW5jZS5jYWxsKHRoaXMsIHNpemUsIHNjcm9sbE9mZnNldCk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5vcHRpb25zLmFsaWdubWVudCAmJiBzY3JvbGxPZmZzZXQgPiAwKSB7XG4gICAgICAgIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBfbm9ybWFsaXplUHJldlZpZXdTZXF1ZW5jZS5jYWxsKHRoaXMsIHNpemUsIHNjcm9sbE9mZnNldCk7XG4gICAgfVxuICAgIGlmIChub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID09PSBzY3JvbGxPZmZzZXQpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgJiYgc2Nyb2xsT2Zmc2V0ID4gMCkge1xuICAgICAgICAgICAgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IF9ub3JtYWxpemVQcmV2Vmlld1NlcXVlbmNlLmNhbGwodGhpcywgc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5vcHRpb25zLmFsaWdubWVudCAmJiBzY3JvbGxPZmZzZXQgPCAwKSB7XG4gICAgICAgICAgICBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gX25vcm1hbGl6ZU5leHRWaWV3U2VxdWVuY2UuY2FsbCh0aGlzLCBzaXplLCBzY3JvbGxPZmZzZXQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ICE9PSBzY3JvbGxPZmZzZXQpIHtcbiAgICAgICAgdmFyIGRlbHRhID0gbm9ybWFsaXplZFNjcm9sbE9mZnNldCAtIHNjcm9sbE9mZnNldDtcbiAgICAgICAgdmFyIHBhcnRpY2xlVmFsdWUgPSB0aGlzLl9zY3JvbGwucGFydGljbGUuZ2V0UG9zaXRpb24xRCgpO1xuICAgICAgICBfc2V0UGFydGljbGUuY2FsbCh0aGlzLCBwYXJ0aWNsZVZhbHVlICsgZGVsdGEsIHVuZGVmaW5lZCwgJ25vcm1hbGl6ZScpO1xuICAgICAgICBpZiAodGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiArPSBkZWx0YTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FwcyAmJiBjYXBzLnNlcXVlbnRpYWxTY3JvbGxpbmdPcHRpbWl6ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ncm91cFN0YXJ0IC09IGRlbHRhO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0O1xufVxuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ2V0VmlzaWJsZUl0ZW1zID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzaXplID0gdGhpcy5fY29udGV4dFNpemVDYWNoZTtcbiAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgKyBzaXplW3RoaXMuX2RpcmVjdGlvbl0gOiB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0O1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX25vZGVzLmdldFN0YXJ0RW51bU5vZGUodHJ1ZSk7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlLl9pbnZhbGlkYXRlZCB8fCBub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IHNjcm9sbE9mZnNldCA+IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICBpZiAoc2Nyb2xsT2Zmc2V0ID49IDAgJiYgbm9kZS5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgaW5kZXg6IG5vZGUuX3ZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpLFxuICAgICAgICAgICAgICAgIHZpZXdTZXF1ZW5jZTogbm9kZS5fdmlld1NlcXVlbmNlLFxuICAgICAgICAgICAgICAgIHJlbmRlck5vZGU6IG5vZGUucmVuZGVyTm9kZSxcbiAgICAgICAgICAgICAgICB2aXNpYmxlUGVyYzogbm9kZS5zY3JvbGxMZW5ndGggPyAoTWF0aC5taW4oc2Nyb2xsT2Zmc2V0LCBzaXplW3RoaXMuX2RpcmVjdGlvbl0pIC0gTWF0aC5tYXgoc2Nyb2xsT2Zmc2V0IC0gbm9kZS5zY3JvbGxMZW5ndGgsIDApKSAvIG5vZGUuc2Nyb2xsTGVuZ3RoIDogMSxcbiAgICAgICAgICAgICAgICBzY3JvbGxPZmZzZXQ6IHNjcm9sbE9mZnNldCAtIG5vZGUuc2Nyb2xsTGVuZ3RoLFxuICAgICAgICAgICAgICAgIHNjcm9sbExlbmd0aDogbm9kZS5zY3JvbGxMZW5ndGhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICBzY3JvbGxPZmZzZXQgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID8gdGhpcy5fc2Nyb2xsLnVubm9ybWFsaXplZFNjcm9sbE9mZnNldCArIHNpemVbdGhpcy5fZGlyZWN0aW9uXSA6IHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQ7XG4gICAgbm9kZSA9IHRoaXMuX25vZGVzLmdldFN0YXJ0RW51bU5vZGUoZmFsc2UpO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQgfHwgbm9kZS5zY3JvbGxMZW5ndGggPT09IHVuZGVmaW5lZCB8fCBzY3JvbGxPZmZzZXQgPCAwKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBzY3JvbGxPZmZzZXQgLT0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgIGlmIChzY3JvbGxPZmZzZXQgPCBzaXplW3RoaXMuX2RpcmVjdGlvbl0gJiYgbm9kZS5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICByZXN1bHQudW5zaGlmdCh7XG4gICAgICAgICAgICAgICAgaW5kZXg6IG5vZGUuX3ZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpLFxuICAgICAgICAgICAgICAgIHZpZXdTZXF1ZW5jZTogbm9kZS5fdmlld1NlcXVlbmNlLFxuICAgICAgICAgICAgICAgIHJlbmRlck5vZGU6IG5vZGUucmVuZGVyTm9kZSxcbiAgICAgICAgICAgICAgICB2aXNpYmxlUGVyYzogbm9kZS5zY3JvbGxMZW5ndGggPyAoTWF0aC5taW4oc2Nyb2xsT2Zmc2V0ICsgbm9kZS5zY3JvbGxMZW5ndGgsIHNpemVbdGhpcy5fZGlyZWN0aW9uXSkgLSBNYXRoLm1heChzY3JvbGxPZmZzZXQsIDApKSAvIG5vZGUuc2Nyb2xsTGVuZ3RoIDogMSxcbiAgICAgICAgICAgICAgICBzY3JvbGxPZmZzZXQ6IHNjcm9sbE9mZnNldCxcbiAgICAgICAgICAgICAgICBzY3JvbGxMZW5ndGg6IG5vZGUuc2Nyb2xsTGVuZ3RoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fcHJldjtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nZXRGaXJzdFZpc2libGVJdGVtID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzaXplID0gdGhpcy5fY29udGV4dFNpemVDYWNoZTtcbiAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgKyBzaXplW3RoaXMuX2RpcmVjdGlvbl0gOiB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0O1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSh0cnVlKTtcbiAgICB2YXIgbm9kZUZvdW5kVmlzaWJsZVBlcmM7XG4gICAgdmFyIG5vZGVGb3VuZFNjcm9sbE9mZnNldDtcbiAgICB2YXIgbm9kZUZvdW5kO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQgfHwgbm9kZS5zY3JvbGxMZW5ndGggPT09IHVuZGVmaW5lZCB8fCBzY3JvbGxPZmZzZXQgPiBzaXplW3RoaXMuX2RpcmVjdGlvbl0pIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHNjcm9sbE9mZnNldCArPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgaWYgKHNjcm9sbE9mZnNldCA+PSAwICYmIG5vZGUuX3ZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgbm9kZUZvdW5kVmlzaWJsZVBlcmMgPSBub2RlLnNjcm9sbExlbmd0aCA/IChNYXRoLm1pbihzY3JvbGxPZmZzZXQsIHNpemVbdGhpcy5fZGlyZWN0aW9uXSkgLSBNYXRoLm1heChzY3JvbGxPZmZzZXQgLSBub2RlLnNjcm9sbExlbmd0aCwgMCkpIC8gbm9kZS5zY3JvbGxMZW5ndGggOiAxO1xuICAgICAgICAgICAgbm9kZUZvdW5kU2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0IC0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICBpZiAobm9kZUZvdW5kVmlzaWJsZVBlcmMgPj0gdGhpcy5vcHRpb25zLnZpc2libGVJdGVtVGhyZXNzaG9sZCB8fCBub2RlRm91bmRTY3JvbGxPZmZzZXQgPj0gMCkge1xuICAgICAgICAgICAgICAgIG5vZGVGb3VuZCA9IG5vZGU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgfVxuICAgIHNjcm9sbE9mZnNldCA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPyB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ICsgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dIDogdGhpcy5fc2Nyb2xsLnVubm9ybWFsaXplZFNjcm9sbE9mZnNldDtcbiAgICBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZShmYWxzZSk7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlLl9pbnZhbGlkYXRlZCB8fCBub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IHNjcm9sbE9mZnNldCA8IDApIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHNjcm9sbE9mZnNldCAtPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgaWYgKHNjcm9sbE9mZnNldCA8IHNpemVbdGhpcy5fZGlyZWN0aW9uXSAmJiBub2RlLl92aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHZhciB2aXNpYmxlUGVyYyA9IG5vZGUuc2Nyb2xsTGVuZ3RoID8gKE1hdGgubWluKHNjcm9sbE9mZnNldCArIG5vZGUuc2Nyb2xsTGVuZ3RoLCBzaXplW3RoaXMuX2RpcmVjdGlvbl0pIC0gTWF0aC5tYXgoc2Nyb2xsT2Zmc2V0LCAwKSkgLyBub2RlLnNjcm9sbExlbmd0aCA6IDE7XG4gICAgICAgICAgICBpZiAodmlzaWJsZVBlcmMgPj0gdGhpcy5vcHRpb25zLnZpc2libGVJdGVtVGhyZXNzaG9sZCB8fCBzY3JvbGxPZmZzZXQgPj0gMCkge1xuICAgICAgICAgICAgICAgIG5vZGVGb3VuZFZpc2libGVQZXJjID0gdmlzaWJsZVBlcmM7XG4gICAgICAgICAgICAgICAgbm9kZUZvdW5kU2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0O1xuICAgICAgICAgICAgICAgIG5vZGVGb3VuZCA9IG5vZGU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX3ByZXY7XG4gICAgfVxuICAgIHJldHVybiBub2RlRm91bmQgPyB7XG4gICAgICAgIGluZGV4OiBub2RlRm91bmQuX3ZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpLFxuICAgICAgICB2aWV3U2VxdWVuY2U6IG5vZGVGb3VuZC5fdmlld1NlcXVlbmNlLFxuICAgICAgICByZW5kZXJOb2RlOiBub2RlRm91bmQucmVuZGVyTm9kZSxcbiAgICAgICAgdmlzaWJsZVBlcmM6IG5vZGVGb3VuZFZpc2libGVQZXJjLFxuICAgICAgICBzY3JvbGxPZmZzZXQ6IG5vZGVGb3VuZFNjcm9sbE9mZnNldCxcbiAgICAgICAgc2Nyb2xsTGVuZ3RoOiBub2RlRm91bmQuc2Nyb2xsTGVuZ3RoXG4gICAgfSA6IHVuZGVmaW5lZDtcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nZXRMYXN0VmlzaWJsZUl0ZW0gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGl0ZW1zID0gdGhpcy5nZXRWaXNpYmxlSXRlbXMoKTtcbiAgICB2YXIgc2l6ZSA9IHRoaXMuX2NvbnRleHRTaXplQ2FjaGU7XG4gICAgZm9yICh2YXIgaSA9IGl0ZW1zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIHZhciBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgIGlmIChpdGVtLnZpc2libGVQZXJjID49IHRoaXMub3B0aW9ucy52aXNpYmxlSXRlbVRocmVzc2hvbGQgfHwgaXRlbS5zY3JvbGxPZmZzZXQgKyBpdGVtLnNjcm9sbExlbmd0aCA8PSBzaXplW3RoaXMuX2RpcmVjdGlvbl0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpdGVtcy5sZW5ndGggPyBpdGVtc1tpdGVtcy5sZW5ndGggLSAxXSA6IHVuZGVmaW5lZDtcbn07XG5mdW5jdGlvbiBfc2Nyb2xsVG9TZXF1ZW5jZSh2aWV3U2VxdWVuY2UsIG5leHQpIHtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9TZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZTtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9SZW5kZXJOb2RlID0gdmlld1NlcXVlbmNlLmdldCgpO1xuICAgIHRoaXMuX3Njcm9sbC5lbnN1cmVWaXNpYmxlUmVuZGVyTm9kZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9EaXJlY3Rpb24gPSBuZXh0O1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxEaXJ0eSA9IHRydWU7XG59XG5mdW5jdGlvbiBfZW5zdXJlVmlzaWJsZVNlcXVlbmNlKHZpZXdTZXF1ZW5jZSwgbmV4dCkge1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxUb1NlcXVlbmNlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxUb1JlbmRlck5vZGUgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fc2Nyb2xsLmVuc3VyZVZpc2libGVSZW5kZXJOb2RlID0gdmlld1NlcXVlbmNlLmdldCgpO1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxUb0RpcmVjdGlvbiA9IG5leHQ7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbERpcnR5ID0gdHJ1ZTtcbn1cbmZ1bmN0aW9uIF9nb1RvUGFnZShhbW91bnQpIHtcbiAgICB2YXIgdmlld1NlcXVlbmNlID0gdGhpcy5fc2Nyb2xsLnNjcm9sbFRvU2VxdWVuY2UgfHwgdGhpcy5fdmlld1NlcXVlbmNlO1xuICAgIGlmICghdGhpcy5fc2Nyb2xsLnNjcm9sbFRvU2VxdWVuY2UpIHtcbiAgICAgICAgdmFyIGZpcnN0VmlzaWJsZUl0ZW0gPSB0aGlzLmdldEZpcnN0VmlzaWJsZUl0ZW0oKTtcbiAgICAgICAgaWYgKGZpcnN0VmlzaWJsZUl0ZW0pIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IGZpcnN0VmlzaWJsZUl0ZW0udmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgaWYgKGFtb3VudCA8IDAgJiYgZmlyc3RWaXNpYmxlSXRlbS5zY3JvbGxPZmZzZXQgPCAwIHx8IGFtb3VudCA+IDAgJiYgZmlyc3RWaXNpYmxlSXRlbS5zY3JvbGxPZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgYW1vdW50ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXZpZXdTZXF1ZW5jZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTWF0aC5hYnMoYW1vdW50KTsgaSsrKSB7XG4gICAgICAgIHZhciBuZXh0Vmlld1NlcXVlbmNlID0gYW1vdW50ID4gMCA/IHZpZXdTZXF1ZW5jZS5nZXROZXh0KCkgOiB2aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgaWYgKG5leHRWaWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IG5leHRWaWV3U2VxdWVuY2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBfc2Nyb2xsVG9TZXF1ZW5jZS5jYWxsKHRoaXMsIHZpZXdTZXF1ZW5jZSwgYW1vdW50ID49IDApO1xufVxuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ29Ub0ZpcnN0UGFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuX3ZpZXdTZXF1ZW5jZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKHRoaXMuX3ZpZXdTZXF1ZW5jZS5fICYmIHRoaXMuX3ZpZXdTZXF1ZW5jZS5fLmxvb3ApIHtcbiAgICAgICAgTGF5b3V0VXRpbGl0eS5lcnJvcignVW5hYmxlIHRvIGdvIHRvIGZpcnN0IGl0ZW0gb2YgbG9vcGVkIFZpZXdTZXF1ZW5jZScpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdmFyIHZpZXdTZXF1ZW5jZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZTtcbiAgICB3aGlsZSAodmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHZhciBwcmV2ID0gdmlld1NlcXVlbmNlLmdldFByZXZpb3VzKCk7XG4gICAgICAgIGlmIChwcmV2ICYmIHByZXYuZ2V0KCkpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IHByZXY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBfc2Nyb2xsVG9TZXF1ZW5jZS5jYWxsKHRoaXMsIHZpZXdTZXF1ZW5jZSwgZmFsc2UpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdvVG9QcmV2aW91c1BhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgX2dvVG9QYWdlLmNhbGwodGhpcywgLTEpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdvVG9OZXh0UGFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBfZ29Ub1BhZ2UuY2FsbCh0aGlzLCAxKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nb1RvTGFzdFBhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLl92aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmICh0aGlzLl92aWV3U2VxdWVuY2UuXyAmJiB0aGlzLl92aWV3U2VxdWVuY2UuXy5sb29wKSB7XG4gICAgICAgIExheW91dFV0aWxpdHkuZXJyb3IoJ1VuYWJsZSB0byBnbyB0byBsYXN0IGl0ZW0gb2YgbG9vcGVkIFZpZXdTZXF1ZW5jZScpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdmFyIHZpZXdTZXF1ZW5jZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZTtcbiAgICB3aGlsZSAodmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHZhciBuZXh0ID0gdmlld1NlcXVlbmNlLmdldE5leHQoKTtcbiAgICAgICAgaWYgKG5leHQgJiYgbmV4dC5nZXQoKSkge1xuICAgICAgICAgICAgdmlld1NlcXVlbmNlID0gbmV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9zY3JvbGxUb1NlcXVlbmNlLmNhbGwodGhpcywgdmlld1NlcXVlbmNlLCB0cnVlKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nb1RvUmVuZGVyTm9kZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgaWYgKCF0aGlzLl92aWV3U2VxdWVuY2UgfHwgIW5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmICh0aGlzLl92aWV3U2VxdWVuY2UuZ2V0KCkgPT09IG5vZGUpIHtcbiAgICAgICAgdmFyIG5leHQgPSBfY2FsY1Njcm9sbE9mZnNldC5jYWxsKHRoaXMpID49IDA7XG4gICAgICAgIF9zY3JvbGxUb1NlcXVlbmNlLmNhbGwodGhpcywgdGhpcy5fdmlld1NlcXVlbmNlLCBuZXh0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHZhciBuZXh0U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgIHZhciBwcmV2U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICB3aGlsZSAoKG5leHRTZXF1ZW5jZSB8fCBwcmV2U2VxdWVuY2UpICYmIG5leHRTZXF1ZW5jZSAhPT0gdGhpcy5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHZhciBuZXh0Tm9kZSA9IG5leHRTZXF1ZW5jZSA/IG5leHRTZXF1ZW5jZS5nZXQoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKG5leHROb2RlID09PSBub2RlKSB7XG4gICAgICAgICAgICBfc2Nyb2xsVG9TZXF1ZW5jZS5jYWxsKHRoaXMsIG5leHRTZXF1ZW5jZSwgdHJ1ZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHJldk5vZGUgPSBwcmV2U2VxdWVuY2UgPyBwcmV2U2VxdWVuY2UuZ2V0KCkgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChwcmV2Tm9kZSA9PT0gbm9kZSkge1xuICAgICAgICAgICAgX3Njcm9sbFRvU2VxdWVuY2UuY2FsbCh0aGlzLCBwcmV2U2VxdWVuY2UsIGZhbHNlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5leHRTZXF1ZW5jZSA9IG5leHROb2RlID8gbmV4dFNlcXVlbmNlLmdldE5leHQoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgcHJldlNlcXVlbmNlID0gcHJldk5vZGUgPyBwcmV2U2VxdWVuY2UuZ2V0UHJldmlvdXMoKSA6IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZW5zdXJlVmlzaWJsZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBWaWV3U2VxdWVuY2UpIHtcbiAgICAgICAgbm9kZSA9IG5vZGUuZ2V0KCk7XG4gICAgfSBlbHNlIGlmIChub2RlIGluc3RhbmNlb2YgTnVtYmVyIHx8IHR5cGVvZiBub2RlID09PSAnbnVtYmVyJykge1xuICAgICAgICB2YXIgdmlld1NlcXVlbmNlID0gdGhpcy5fdmlld1NlcXVlbmNlO1xuICAgICAgICB3aGlsZSAodmlld1NlcXVlbmNlLmdldEluZGV4KCkgPCBub2RlKSB7XG4gICAgICAgICAgICB2aWV3U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgICAgICAgICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAodmlld1NlcXVlbmNlLmdldEluZGV4KCkgPiBub2RlKSB7XG4gICAgICAgICAgICB2aWV3U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgICAgIGlmICghdmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuX3ZpZXdTZXF1ZW5jZS5nZXQoKSA9PT0gbm9kZSkge1xuICAgICAgICB2YXIgbmV4dCA9IF9jYWxjU2Nyb2xsT2Zmc2V0LmNhbGwodGhpcykgPj0gMDtcbiAgICAgICAgX2Vuc3VyZVZpc2libGVTZXF1ZW5jZS5jYWxsKHRoaXMsIHRoaXMuX3ZpZXdTZXF1ZW5jZSwgbmV4dCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB2YXIgbmV4dFNlcXVlbmNlID0gdGhpcy5fdmlld1NlcXVlbmNlLmdldE5leHQoKTtcbiAgICB2YXIgcHJldlNlcXVlbmNlID0gdGhpcy5fdmlld1NlcXVlbmNlLmdldFByZXZpb3VzKCk7XG4gICAgd2hpbGUgKChuZXh0U2VxdWVuY2UgfHwgcHJldlNlcXVlbmNlKSAmJiBuZXh0U2VxdWVuY2UgIT09IHRoaXMuX3ZpZXdTZXF1ZW5jZSkge1xuICAgICAgICB2YXIgbmV4dE5vZGUgPSBuZXh0U2VxdWVuY2UgPyBuZXh0U2VxdWVuY2UuZ2V0KCkgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChuZXh0Tm9kZSA9PT0gbm9kZSkge1xuICAgICAgICAgICAgX2Vuc3VyZVZpc2libGVTZXF1ZW5jZS5jYWxsKHRoaXMsIG5leHRTZXF1ZW5jZSwgdHJ1ZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHJldk5vZGUgPSBwcmV2U2VxdWVuY2UgPyBwcmV2U2VxdWVuY2UuZ2V0KCkgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChwcmV2Tm9kZSA9PT0gbm9kZSkge1xuICAgICAgICAgICAgX2Vuc3VyZVZpc2libGVTZXF1ZW5jZS5jYWxsKHRoaXMsIHByZXZTZXF1ZW5jZSwgZmFsc2UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dFNlcXVlbmNlID0gbmV4dE5vZGUgPyBuZXh0U2VxdWVuY2UuZ2V0TmV4dCgpIDogdW5kZWZpbmVkO1xuICAgICAgICBwcmV2U2VxdWVuY2UgPSBwcmV2Tm9kZSA/IHByZXZTZXF1ZW5jZS5nZXRQcmV2aW91cygpIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5zY3JvbGwgPSBmdW5jdGlvbiAoZGVsdGEpIHtcbiAgICB0aGlzLmhhbHQoKTtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGVsdGEgKz0gZGVsdGE7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuY2FuU2Nyb2xsID0gZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgdmFyIHNjcm9sbE9mZnNldCA9IF9jYWxjU2Nyb2xsT2Zmc2V0LmNhbGwodGhpcyk7XG4gICAgdmFyIHByZXZIZWlnaHQgPSB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KGZhbHNlKTtcbiAgICB2YXIgbmV4dEhlaWdodCA9IHRoaXMuX2NhbGNTY3JvbGxIZWlnaHQodHJ1ZSk7XG4gICAgdmFyIHRvdGFsSGVpZ2h0O1xuICAgIGlmIChuZXh0SGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgcHJldkhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRvdGFsSGVpZ2h0ID0gcHJldkhlaWdodCArIG5leHRIZWlnaHQ7XG4gICAgfVxuICAgIGlmICh0b3RhbEhlaWdodCAhPT0gdW5kZWZpbmVkICYmIHRvdGFsSGVpZ2h0IDw9IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKGRlbHRhIDwgMCAmJiBuZXh0SGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIG5leHRPZmZzZXQgPSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlW3RoaXMuX2RpcmVjdGlvbl0gLSAoc2Nyb2xsT2Zmc2V0ICsgbmV4dEhlaWdodCk7XG4gICAgICAgIHJldHVybiBNYXRoLm1heChuZXh0T2Zmc2V0LCBkZWx0YSk7XG4gICAgfSBlbHNlIGlmIChkZWx0YSA+IDAgJiYgcHJldkhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhciBwcmV2T2Zmc2V0ID0gLShzY3JvbGxPZmZzZXQgLSBwcmV2SGVpZ2h0KTtcbiAgICAgICAgcmV0dXJuIE1hdGgubWluKHByZXZPZmZzZXQsIGRlbHRhKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlbHRhO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmhhbHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbFRvU2VxdWVuY2UgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbFRvUmVuZGVyTm9kZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zY3JvbGwuZW5zdXJlVmlzaWJsZVJlbmRlck5vZGUgPSB1bmRlZmluZWQ7XG4gICAgX3NldFBhcnRpY2xlLmNhbGwodGhpcywgdW5kZWZpbmVkLCAwLCAnaGFsdCcpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmlzU2Nyb2xsaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9zY3JvbGwuaXNTY3JvbGxpbmc7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ2V0Qm91bmRzUmVhY2hlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2Nyb2xsLmJvdW5kc1JlYWNoZWQ7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ2V0VmVsb2NpdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZS5nZXRWZWxvY2l0eTFEKCk7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuc2V0VmVsb2NpdHkgPSBmdW5jdGlvbiAodmVsb2NpdHkpIHtcbiAgICByZXR1cm4gdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLnNldFZlbG9jaXR5MUQodmVsb2NpdHkpO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmFwcGx5U2Nyb2xsRm9yY2UgPSBmdW5jdGlvbiAoZGVsdGEpIHtcbiAgICB0aGlzLmhhbHQoKTtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCsrO1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZSArPSBkZWx0YTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVTY3JvbGxGb3JjZSA9IGZ1bmN0aW9uIChwcmV2RGVsdGEsIG5ld0RlbHRhKSB7XG4gICAgdGhpcy5oYWx0KCk7XG4gICAgbmV3RGVsdGEgLT0gcHJldkRlbHRhO1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZSArPSBuZXdEZWx0YTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UgPSBmdW5jdGlvbiAoZGVsdGEsIHZlbG9jaXR5KSB7XG4gICAgdGhpcy5oYWx0KCk7XG4gICAgaWYgKHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZUNvdW50ID09PSAxKSB7XG4gICAgICAgIHZhciBzY3JvbGxPZmZzZXQgPSBfY2FsY1Njcm9sbE9mZnNldC5jYWxsKHRoaXMpO1xuICAgICAgICBfc2V0UGFydGljbGUuY2FsbCh0aGlzLCBzY3JvbGxPZmZzZXQsIHZlbG9jaXR5LCAncmVsZWFzZVNjcm9sbEZvcmNlJyk7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5wZS53YWtlKCk7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZSA9IDA7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxEaXJ0eSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlIC09IGRlbHRhO1xuICAgIH1cbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudC0tO1xuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdldFNwZWMgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBzcGVjID0gTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuZ2V0U3BlYy5jYWxsKHRoaXMsIG5vZGUpO1xuICAgIGlmIChzcGVjICYmIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMgJiYgdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcy5zZXF1ZW50aWFsU2Nyb2xsaW5nT3B0aW1pemVkKSB7XG4gICAgICAgIHNwZWMgPSB7XG4gICAgICAgICAgICBvcmlnaW46IHNwZWMub3JpZ2luLFxuICAgICAgICAgICAgYWxpZ246IHNwZWMuYWxpZ24sXG4gICAgICAgICAgICBvcGFjaXR5OiBzcGVjLm9wYWNpdHksXG4gICAgICAgICAgICBzaXplOiBzcGVjLnNpemUsXG4gICAgICAgICAgICByZW5kZXJOb2RlOiBzcGVjLnJlbmRlck5vZGUsXG4gICAgICAgICAgICB0cmFuc2Zvcm06IHNwZWMudHJhbnNmb3JtXG4gICAgICAgIH07XG4gICAgICAgIHZhciB0cmFuc2xhdGUgPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgIHRyYW5zbGF0ZVt0aGlzLl9kaXJlY3Rpb25dID0gdGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGUgKyB0aGlzLl9zY3JvbGwuZ3JvdXBTdGFydDtcbiAgICAgICAgc3BlYy50cmFuc2Zvcm0gPSBUcmFuc2Zvcm0udGhlbk1vdmUoc3BlYy50cmFuc2Zvcm0sIHRyYW5zbGF0ZSk7XG4gICAgfVxuICAgIHJldHVybiBzcGVjO1xufTtcbmZ1bmN0aW9uIF9sYXlvdXQoc2l6ZSwgc2Nyb2xsT2Zmc2V0LCBuZXN0ZWQpIHtcbiAgICB0aGlzLl9kZWJ1Zy5sYXlvdXRDb3VudCsrO1xuICAgIHZhciBzY3JvbGxTdGFydCA9IDAgLSBNYXRoLm1heCh0aGlzLm9wdGlvbnMuZXh0cmFCb3VuZHNTcGFjZVswXSwgMSk7XG4gICAgdmFyIHNjcm9sbEVuZCA9IHNpemVbdGhpcy5fZGlyZWN0aW9uXSArIE1hdGgubWF4KHRoaXMub3B0aW9ucy5leHRyYUJvdW5kc1NwYWNlWzFdLCAxKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmxheW91dEFsbCkge1xuICAgICAgICBzY3JvbGxTdGFydCA9IC0xMDAwMDAwO1xuICAgICAgICBzY3JvbGxFbmQgPSAxMDAwMDAwO1xuICAgIH1cbiAgICB2YXIgbGF5b3V0Q29udGV4dCA9IHRoaXMuX25vZGVzLnByZXBhcmVGb3JMYXlvdXQodGhpcy5fdmlld1NlcXVlbmNlLCB0aGlzLl9ub2Rlc0J5SWQsIHtcbiAgICAgICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgICAgICBkaXJlY3Rpb246IHRoaXMuX2RpcmVjdGlvbixcbiAgICAgICAgICAgIHJldmVyc2U6IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgICAgICBzY3JvbGxPZmZzZXQ6IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPyBzY3JvbGxPZmZzZXQgKyBzaXplW3RoaXMuX2RpcmVjdGlvbl0gOiBzY3JvbGxPZmZzZXQsXG4gICAgICAgICAgICBzY3JvbGxTdGFydDogc2Nyb2xsU3RhcnQsXG4gICAgICAgICAgICBzY3JvbGxFbmQ6IHNjcm9sbEVuZFxuICAgICAgICB9KTtcbiAgICBpZiAodGhpcy5fbGF5b3V0Ll9mdW5jdGlvbikge1xuICAgICAgICB0aGlzLl9sYXlvdXQuX2Z1bmN0aW9uKGxheW91dENvbnRleHQsIHRoaXMuX2xheW91dC5vcHRpb25zKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Bvc3RMYXlvdXQpIHtcbiAgICAgICAgdGhpcy5fcG9zdExheW91dChzaXplLCBzY3JvbGxPZmZzZXQpO1xuICAgIH1cbiAgICB0aGlzLl9ub2Rlcy5yZW1vdmVOb25JbnZhbGlkYXRlZE5vZGVzKHRoaXMub3B0aW9ucy5yZW1vdmVTcGVjKTtcbiAgICBfY2FsY0JvdW5kcy5jYWxsKHRoaXMsIHNpemUsIHNjcm9sbE9mZnNldCk7XG4gICAgX2NhbGNTY3JvbGxUb09mZnNldC5jYWxsKHRoaXMsIHNpemUsIHNjcm9sbE9mZnNldCk7XG4gICAgX3NuYXBUb1BhZ2UuY2FsbCh0aGlzLCBzaXplLCBzY3JvbGxPZmZzZXQpO1xuICAgIHZhciBuZXdTY3JvbGxPZmZzZXQgPSBfY2FsY1Njcm9sbE9mZnNldC5jYWxsKHRoaXMsIHRydWUpO1xuICAgIGlmICghbmVzdGVkICYmIG5ld1Njcm9sbE9mZnNldCAhPT0gc2Nyb2xsT2Zmc2V0KSB7XG4gICAgICAgIHJldHVybiBfbGF5b3V0LmNhbGwodGhpcywgc2l6ZSwgbmV3U2Nyb2xsT2Zmc2V0LCB0cnVlKTtcbiAgICB9XG4gICAgdGhpcy5fc2Nyb2xsLnVubm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IHNjcm9sbE9mZnNldDtcbiAgICBzY3JvbGxPZmZzZXQgPSBfbm9ybWFsaXplVmlld1NlcXVlbmNlLmNhbGwodGhpcywgc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICBfdXBkYXRlU3ByaW5nLmNhbGwodGhpcyk7XG4gICAgcmV0dXJuIHNjcm9sbE9mZnNldDtcbn1cbmZ1bmN0aW9uIF9pbm5lclJlbmRlcigpIHtcbiAgICB2YXIgc3BlY3MgPSB0aGlzLl9zcGVjcztcbiAgICBmb3IgKHZhciBpMyA9IDAsIGozID0gc3BlY3MubGVuZ3RoOyBpMyA8IGozOyBpMysrKSB7XG4gICAgICAgIHNwZWNzW2kzXS50YXJnZXQgPSBzcGVjc1tpM10ucmVuZGVyTm9kZS5yZW5kZXIoKTtcbiAgICB9XG4gICAgcmV0dXJuIHNwZWNzO1xufVxuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuY29tbWl0ID0gZnVuY3Rpb24gY29tbWl0KGNvbnRleHQpIHtcbiAgICB2YXIgc2l6ZSA9IGNvbnRleHQuc2l6ZTtcbiAgICB0aGlzLl9kZWJ1Zy5jb21taXRDb3VudCsrO1xuICAgIHZhciBzY3JvbGxPZmZzZXQgPSBfY2FsY1Njcm9sbE9mZnNldC5jYWxsKHRoaXMsIHRydWUsIHRydWUpO1xuICAgIGlmICh0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbE9mZnNldENhY2hlID0gc2Nyb2xsT2Zmc2V0O1xuICAgIH1cbiAgICB2YXIgZW1pdEVuZFNjcm9sbGluZ0V2ZW50ID0gZmFsc2U7XG4gICAgdmFyIGVtaXRTY3JvbGxFdmVudCA9IGZhbHNlO1xuICAgIHZhciBldmVudERhdGE7XG4gICAgaWYgKHNpemVbMF0gIT09IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMF0gfHwgc2l6ZVsxXSAhPT0gdGhpcy5fY29udGV4dFNpemVDYWNoZVsxXSB8fCB0aGlzLl9pc0RpcnR5IHx8IHRoaXMuX3Njcm9sbC5zY3JvbGxEaXJ0eSB8fCB0aGlzLl9ub2Rlcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQgfHwgdGhpcy5vcHRpb25zLmFsd2F5c0xheW91dCB8fCB0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZSAhPT0gc2Nyb2xsT2Zmc2V0KSB7XG4gICAgICAgIGV2ZW50RGF0YSA9IHtcbiAgICAgICAgICAgIHRhcmdldDogdGhpcyxcbiAgICAgICAgICAgIG9sZFNpemU6IHRoaXMuX2NvbnRleHRTaXplQ2FjaGUsXG4gICAgICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICAgICAgb2xkU2Nyb2xsT2Zmc2V0OiB0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZSxcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldDogc2Nyb2xsT2Zmc2V0XG4gICAgICAgIH07XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZSAhPT0gc2Nyb2xsT2Zmc2V0KSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3Njcm9sbC5pc1Njcm9sbGluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5pc1Njcm9sbGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgnc2Nyb2xsc3RhcnQnLCBldmVudERhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW1pdFNjcm9sbEV2ZW50ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdsYXlvdXRzdGFydCcsIGV2ZW50RGF0YSk7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZmxvdyAmJiAodGhpcy5faXNEaXJ0eSB8fCB0aGlzLm9wdGlvbnMucmVmbG93T25SZXNpemUgJiYgKHNpemVbMF0gIT09IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMF0gfHwgc2l6ZVsxXSAhPT0gdGhpcy5fY29udGV4dFNpemVDYWNoZVsxXSkpKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMuX25vZGVzLmdldFN0YXJ0RW51bU5vZGUoKTtcbiAgICAgICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5yZWxlYXNlTG9jaygpO1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMF0gPSBzaXplWzBdO1xuICAgICAgICB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzFdID0gc2l6ZVsxXTtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgPSBmYWxzZTtcbiAgICAgICAgc2Nyb2xsT2Zmc2V0ID0gX2xheW91dC5jYWxsKHRoaXMsIHNpemUsIHNjcm9sbE9mZnNldCk7XG4gICAgICAgIHRoaXMuX3Njcm9sbE9mZnNldENhY2hlID0gc2Nyb2xsT2Zmc2V0O1xuICAgICAgICBldmVudERhdGEuc2Nyb2xsT2Zmc2V0ID0gdGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGU7XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ2xheW91dGVuZCcsIGV2ZW50RGF0YSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9zY3JvbGwuaXNTY3JvbGxpbmcgJiYgIXRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZUNvdW50KSB7XG4gICAgICAgIGVtaXRFbmRTY3JvbGxpbmdFdmVudCA9IHRydWU7XG4gICAgfVxuICAgIHZhciBncm91cFRyYW5zbGF0ZSA9IHRoaXMuX3Njcm9sbC5ncm91cFRyYW5zbGF0ZTtcbiAgICBncm91cFRyYW5zbGF0ZVswXSA9IDA7XG4gICAgZ3JvdXBUcmFuc2xhdGVbMV0gPSAwO1xuICAgIGdyb3VwVHJhbnNsYXRlWzJdID0gMDtcbiAgICBncm91cFRyYW5zbGF0ZVt0aGlzLl9kaXJlY3Rpb25dID0gLXRoaXMuX3Njcm9sbC5ncm91cFN0YXJ0IC0gc2Nyb2xsT2Zmc2V0O1xuICAgIHZhciBzZXF1ZW50aWFsU2Nyb2xsaW5nT3B0aW1pemVkID0gdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcyA/IHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuc2VxdWVudGlhbFNjcm9sbGluZ09wdGltaXplZCA6IGZhbHNlO1xuICAgIHZhciByZXN1bHQgPSB0aGlzLl9ub2Rlcy5idWlsZFNwZWNBbmREZXN0cm95VW5yZW5kZXJlZE5vZGVzKHNlcXVlbnRpYWxTY3JvbGxpbmdPcHRpbWl6ZWQgPyBncm91cFRyYW5zbGF0ZSA6IHVuZGVmaW5lZCk7XG4gICAgdGhpcy5fc3BlY3MgPSByZXN1bHQuc3BlY3M7XG4gICAgaWYgKHJlc3VsdC5tb2RpZmllZCkge1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdyZWZsb3cnLCB7IHRhcmdldDogdGhpcyB9KTtcbiAgICB9XG4gICAgaWYgKGVtaXRTY3JvbGxFdmVudCkge1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdzY3JvbGwnLCBldmVudERhdGEpO1xuICAgIH1cbiAgICBpZiAoZXZlbnREYXRhKSB7XG4gICAgICAgIHZhciB2aXNpYmxlSXRlbSA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPyB0aGlzLmdldExhc3RWaXNpYmxlSXRlbSgpIDogdGhpcy5nZXRGaXJzdFZpc2libGVJdGVtKCk7XG4gICAgICAgIGlmICh2aXNpYmxlSXRlbSAmJiAhdGhpcy5fdmlzaWJsZUl0ZW1DYWNoZSB8fCAhdmlzaWJsZUl0ZW0gJiYgdGhpcy5fdmlzaWJsZUl0ZW1DYWNoZSB8fCB2aXNpYmxlSXRlbSAmJiB0aGlzLl92aXNpYmxlSXRlbUNhY2hlICYmIHZpc2libGVJdGVtLnJlbmRlck5vZGUgIT09IHRoaXMuX3Zpc2libGVJdGVtQ2FjaGUucmVuZGVyTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgncGFnZWNoYW5nZScsIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHRoaXMsXG4gICAgICAgICAgICAgICAgb2xkVmlld1NlcXVlbmNlOiB0aGlzLl92aXNpYmxlSXRlbUNhY2hlID8gdGhpcy5fdmlzaWJsZUl0ZW1DYWNoZS52aWV3U2VxdWVuY2UgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgdmlld1NlcXVlbmNlOiB2aXNpYmxlSXRlbSA/IHZpc2libGVJdGVtLnZpZXdTZXF1ZW5jZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBvbGRJbmRleDogdGhpcy5fdmlzaWJsZUl0ZW1DYWNoZSA/IHRoaXMuX3Zpc2libGVJdGVtQ2FjaGUuaW5kZXggOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgaW5kZXg6IHZpc2libGVJdGVtID8gdmlzaWJsZUl0ZW0uaW5kZXggOiB1bmRlZmluZWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fdmlzaWJsZUl0ZW1DYWNoZSA9IHZpc2libGVJdGVtO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChlbWl0RW5kU2Nyb2xsaW5nRXZlbnQpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLmlzU2Nyb2xsaW5nID0gZmFsc2U7XG4gICAgICAgIGV2ZW50RGF0YSA9IHtcbiAgICAgICAgICAgIHRhcmdldDogdGhpcyxcbiAgICAgICAgICAgIG9sZFNpemU6IHNpemUsXG4gICAgICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICAgICAgb2xkU2Nyb2xsT2Zmc2V0OiBzY3JvbGxPZmZzZXQsXG4gICAgICAgICAgICBzY3JvbGxPZmZzZXQ6IHNjcm9sbE9mZnNldFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdzY3JvbGxlbmQnLCBldmVudERhdGEpO1xuICAgIH1cbiAgICB2YXIgdHJhbnNmb3JtID0gY29udGV4dC50cmFuc2Zvcm07XG4gICAgaWYgKHNlcXVlbnRpYWxTY3JvbGxpbmdPcHRpbWl6ZWQpIHtcbiAgICAgICAgdmFyIHdpbmRvd09mZnNldCA9IHNjcm9sbE9mZnNldCArIHRoaXMuX3Njcm9sbC5ncm91cFN0YXJ0O1xuICAgICAgICB2YXIgdHJhbnNsYXRlID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB0cmFuc2xhdGVbdGhpcy5fZGlyZWN0aW9uXSA9IHdpbmRvd09mZnNldDtcbiAgICAgICAgdHJhbnNmb3JtID0gVHJhbnNmb3JtLnRoZW5Nb3ZlKHRyYW5zZm9ybSwgdHJhbnNsYXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2Zvcm0sXG4gICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgIG9wYWNpdHk6IGNvbnRleHQub3BhY2l0eSxcbiAgICAgICAgb3JpZ2luOiBjb250ZXh0Lm9yaWdpbixcbiAgICAgICAgdGFyZ2V0OiB0aGlzLmdyb3VwLnJlbmRlcigpXG4gICAgfTtcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgaWYgKHRoaXMuY29udGFpbmVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lci5yZW5kZXIuYXBwbHkodGhpcy5jb250YWluZXIsIGFyZ3VtZW50cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gU2Nyb2xsQ29udHJvbGxlcjsiLCJ2YXIgTGF5b3V0VXRpbGl0eSA9IHJlcXVpcmUoJy4uL0xheW91dFV0aWxpdHknKTtcbmZ1bmN0aW9uIExheW91dERvY2tIZWxwZXIoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBzaXplID0gY29udGV4dC5zaXplO1xuICAgIHRoaXMuX3NpemUgPSBzaXplO1xuICAgIHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xuICAgIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuX3ogPSBvcHRpb25zICYmIG9wdGlvbnMudHJhbnNsYXRlWiA/IG9wdGlvbnMudHJhbnNsYXRlWiA6IDA7XG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5tYXJnaW5zKSB7XG4gICAgICAgIHZhciBtYXJnaW5zID0gTGF5b3V0VXRpbGl0eS5ub3JtYWxpemVNYXJnaW5zKG9wdGlvbnMubWFyZ2lucyk7XG4gICAgICAgIHRoaXMuX2xlZnQgPSBtYXJnaW5zWzNdO1xuICAgICAgICB0aGlzLl90b3AgPSBtYXJnaW5zWzBdO1xuICAgICAgICB0aGlzLl9yaWdodCA9IHNpemVbMF0gLSBtYXJnaW5zWzFdO1xuICAgICAgICB0aGlzLl9ib3R0b20gPSBzaXplWzFdIC0gbWFyZ2luc1syXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9sZWZ0ID0gMDtcbiAgICAgICAgdGhpcy5fdG9wID0gMDtcbiAgICAgICAgdGhpcy5fcmlnaHQgPSBzaXplWzBdO1xuICAgICAgICB0aGlzLl9ib3R0b20gPSBzaXplWzFdO1xuICAgIH1cbn1cbkxheW91dERvY2tIZWxwZXIucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHJ1bGUgPSBkYXRhW2ldO1xuICAgICAgICB2YXIgdmFsdWUgPSBydWxlLmxlbmd0aCA+PSAzID8gcnVsZVsyXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHJ1bGVbMF0gPT09ICd0b3AnKSB7XG4gICAgICAgICAgICB0aGlzLnRvcChydWxlWzFdLCB2YWx1ZSwgcnVsZS5sZW5ndGggPj0gNCA/IHJ1bGVbM10gOiB1bmRlZmluZWQpO1xuICAgICAgICB9IGVsc2UgaWYgKHJ1bGVbMF0gPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgdGhpcy5sZWZ0KHJ1bGVbMV0sIHZhbHVlLCBydWxlLmxlbmd0aCA+PSA0ID8gcnVsZVszXSA6IHVuZGVmaW5lZCk7XG4gICAgICAgIH0gZWxzZSBpZiAocnVsZVswXSA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgdGhpcy5yaWdodChydWxlWzFdLCB2YWx1ZSwgcnVsZS5sZW5ndGggPj0gNCA/IHJ1bGVbM10gOiB1bmRlZmluZWQpO1xuICAgICAgICB9IGVsc2UgaWYgKHJ1bGVbMF0gPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgICB0aGlzLmJvdHRvbShydWxlWzFdLCB2YWx1ZSwgcnVsZS5sZW5ndGggPj0gNCA/IHJ1bGVbM10gOiB1bmRlZmluZWQpO1xuICAgICAgICB9IGVsc2UgaWYgKHJ1bGVbMF0gPT09ICdmaWxsJykge1xuICAgICAgICAgICAgdGhpcy5maWxsKHJ1bGVbMV0sIHJ1bGUubGVuZ3RoID49IDMgPyBydWxlWzJdIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfSBlbHNlIGlmIChydWxlWzBdID09PSAnbWFyZ2lucycpIHtcbiAgICAgICAgICAgIHRoaXMubWFyZ2lucyhydWxlWzFdKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5MYXlvdXREb2NrSGVscGVyLnByb3RvdHlwZS50b3AgPSBmdW5jdGlvbiAobm9kZSwgaGVpZ2h0LCB6KSB7XG4gICAgaWYgKGhlaWdodCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGhlaWdodCA9IGhlaWdodFsxXTtcbiAgICB9XG4gICAgaWYgKGhlaWdodCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhciBzaXplID0gdGhpcy5fY29udGV4dC5yZXNvbHZlU2l6ZShub2RlLCBbXG4gICAgICAgICAgICAgICAgdGhpcy5fcmlnaHQgLSB0aGlzLl9sZWZ0LFxuICAgICAgICAgICAgICAgIHRoaXMuX2JvdHRvbSAtIHRoaXMuX3RvcFxuICAgICAgICAgICAgXSk7XG4gICAgICAgIGhlaWdodCA9IHNpemVbMV07XG4gICAgfVxuICAgIHRoaXMuX2NvbnRleHQuc2V0KG5vZGUsIHtcbiAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgdGhpcy5fcmlnaHQgLSB0aGlzLl9sZWZ0LFxuICAgICAgICAgICAgaGVpZ2h0XG4gICAgICAgIF0sXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgYWxpZ246IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgdGhpcy5fbGVmdCxcbiAgICAgICAgICAgIHRoaXMuX3RvcCxcbiAgICAgICAgICAgIHogPT09IHVuZGVmaW5lZCA/IHRoaXMuX3ogOiB6XG4gICAgICAgIF1cbiAgICB9KTtcbiAgICB0aGlzLl90b3AgKz0gaGVpZ2h0O1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dERvY2tIZWxwZXIucHJvdG90eXBlLmxlZnQgPSBmdW5jdGlvbiAobm9kZSwgd2lkdGgsIHopIHtcbiAgICBpZiAod2lkdGggaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICB3aWR0aCA9IHdpZHRoWzBdO1xuICAgIH1cbiAgICBpZiAod2lkdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgc2l6ZSA9IHRoaXMuX2NvbnRleHQucmVzb2x2ZVNpemUobm9kZSwgW1xuICAgICAgICAgICAgICAgIHRoaXMuX3JpZ2h0IC0gdGhpcy5fbGVmdCxcbiAgICAgICAgICAgICAgICB0aGlzLl9ib3R0b20gLSB0aGlzLl90b3BcbiAgICAgICAgICAgIF0pO1xuICAgICAgICB3aWR0aCA9IHNpemVbMF07XG4gICAgfVxuICAgIHRoaXMuX2NvbnRleHQuc2V0KG5vZGUsIHtcbiAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICB0aGlzLl9ib3R0b20gLSB0aGlzLl90b3BcbiAgICAgICAgXSxcbiAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBhbGlnbjogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICB0aGlzLl9sZWZ0LFxuICAgICAgICAgICAgdGhpcy5fdG9wLFxuICAgICAgICAgICAgeiA9PT0gdW5kZWZpbmVkID8gdGhpcy5feiA6IHpcbiAgICAgICAgXVxuICAgIH0pO1xuICAgIHRoaXMuX2xlZnQgKz0gd2lkdGg7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0RG9ja0hlbHBlci5wcm90b3R5cGUuYm90dG9tID0gZnVuY3Rpb24gKG5vZGUsIGhlaWdodCwgeikge1xuICAgIGlmIChoZWlnaHQgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBoZWlnaHQgPSBoZWlnaHRbMV07XG4gICAgfVxuICAgIGlmIChoZWlnaHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgc2l6ZSA9IHRoaXMuX2NvbnRleHQucmVzb2x2ZVNpemUobm9kZSwgW1xuICAgICAgICAgICAgICAgIHRoaXMuX3JpZ2h0IC0gdGhpcy5fbGVmdCxcbiAgICAgICAgICAgICAgICB0aGlzLl9ib3R0b20gLSB0aGlzLl90b3BcbiAgICAgICAgICAgIF0pO1xuICAgICAgICBoZWlnaHQgPSBzaXplWzFdO1xuICAgIH1cbiAgICB0aGlzLl9jb250ZXh0LnNldChub2RlLCB7XG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIHRoaXMuX3JpZ2h0IC0gdGhpcy5fbGVmdCxcbiAgICAgICAgICAgIGhlaWdodFxuICAgICAgICBdLFxuICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAxXG4gICAgICAgIF0sXG4gICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMVxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICAtKHRoaXMuX3NpemVbMV0gLSB0aGlzLl9ib3R0b20pLFxuICAgICAgICAgICAgeiA9PT0gdW5kZWZpbmVkID8gdGhpcy5feiA6IHpcbiAgICAgICAgXVxuICAgIH0pO1xuICAgIHRoaXMuX2JvdHRvbSAtPSBoZWlnaHQ7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0RG9ja0hlbHBlci5wcm90b3R5cGUucmlnaHQgPSBmdW5jdGlvbiAobm9kZSwgd2lkdGgsIHopIHtcbiAgICBpZiAod2lkdGggaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICB3aWR0aCA9IHdpZHRoWzBdO1xuICAgIH1cbiAgICBpZiAobm9kZSkge1xuICAgICAgICBpZiAod2lkdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFyIHNpemUgPSB0aGlzLl9jb250ZXh0LnJlc29sdmVTaXplKG5vZGUsIFtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmlnaHQgLSB0aGlzLl9sZWZ0LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ib3R0b20gLSB0aGlzLl90b3BcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIHdpZHRoID0gc2l6ZVswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb250ZXh0LnNldChub2RlLCB7XG4gICAgICAgICAgICBzaXplOiBbXG4gICAgICAgICAgICAgICAgd2lkdGgsXG4gICAgICAgICAgICAgICAgdGhpcy5fYm90dG9tIC0gdGhpcy5fdG9wXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgYWxpZ246IFtcbiAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgICAgICAtKHRoaXMuX3NpemVbMF0gLSB0aGlzLl9yaWdodCksXG4gICAgICAgICAgICAgICAgdGhpcy5fdG9wLFxuICAgICAgICAgICAgICAgIHogPT09IHVuZGVmaW5lZCA/IHRoaXMuX3ogOiB6XG4gICAgICAgICAgICBdXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAod2lkdGgpIHtcbiAgICAgICAgdGhpcy5fcmlnaHQgLT0gd2lkdGg7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dERvY2tIZWxwZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiAobm9kZSwgeikge1xuICAgIHRoaXMuX2NvbnRleHQuc2V0KG5vZGUsIHtcbiAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgdGhpcy5fcmlnaHQgLSB0aGlzLl9sZWZ0LFxuICAgICAgICAgICAgdGhpcy5fYm90dG9tIC0gdGhpcy5fdG9wXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgdGhpcy5fbGVmdCxcbiAgICAgICAgICAgIHRoaXMuX3RvcCxcbiAgICAgICAgICAgIHogPT09IHVuZGVmaW5lZCA/IHRoaXMuX3ogOiB6XG4gICAgICAgIF1cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXREb2NrSGVscGVyLnByb3RvdHlwZS5tYXJnaW5zID0gZnVuY3Rpb24gKG1hcmdpbnMpIHtcbiAgICBtYXJnaW5zID0gTGF5b3V0VXRpbGl0eS5ub3JtYWxpemVNYXJnaW5zKG1hcmdpbnMpO1xuICAgIHRoaXMuX2xlZnQgKz0gbWFyZ2luc1szXTtcbiAgICB0aGlzLl90b3AgKz0gbWFyZ2luc1swXTtcbiAgICB0aGlzLl9yaWdodCAtPSBtYXJnaW5zWzFdO1xuICAgIHRoaXMuX2JvdHRvbSAtPSBtYXJnaW5zWzJdO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dFV0aWxpdHkucmVnaXN0ZXJIZWxwZXIoJ2RvY2snLCBMYXlvdXREb2NrSGVscGVyKTtcbm1vZHVsZS5leHBvcnRzID0gTGF5b3V0RG9ja0hlbHBlcjsiLCJ2YXIgVXRpbGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IG51bGw7XG52YXIgTGF5b3V0VXRpbGl0eSA9IHJlcXVpcmUoJy4uL0xheW91dFV0aWxpdHknKTtcbnZhciBjYXBhYmlsaXRpZXMgPSB7XG4gICAgICAgIHNlcXVlbmNlOiB0cnVlLFxuICAgICAgICBkaXJlY3Rpb246IFtcbiAgICAgICAgICAgIFV0aWxpdHkuRGlyZWN0aW9uLlksXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5YXG4gICAgICAgIF0sXG4gICAgICAgIHNjcm9sbGluZzogdHJ1ZSxcbiAgICAgICAgdHJ1ZVNpemU6IHRydWUsXG4gICAgICAgIHNlcXVlbnRpYWxTY3JvbGxpbmdPcHRpbWl6ZWQ6IHRydWVcbiAgICB9O1xudmFyIGNvbnRleHQ7XG52YXIgc2l6ZTtcbnZhciBkaXJlY3Rpb247XG52YXIgYWxpZ25tZW50O1xudmFyIGxpbmVEaXJlY3Rpb247XG52YXIgbGluZUxlbmd0aDtcbnZhciBvZmZzZXQ7XG52YXIgbWFyZ2lucztcbnZhciBtYXJnaW4gPSBbXG4gICAgICAgIDAsXG4gICAgICAgIDBcbiAgICBdO1xudmFyIHNwYWNpbmc7XG52YXIganVzdGlmeTtcbnZhciBpdGVtU2l6ZTtcbnZhciBnZXRJdGVtU2l6ZTtcbnZhciBsaW5lTm9kZXM7XG5mdW5jdGlvbiBfbGF5b3V0TGluZShuZXh0LCBlbmRSZWFjaGVkKSB7XG4gICAgaWYgKCFsaW5lTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgaTtcbiAgICB2YXIgbGluZVNpemUgPSBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdO1xuICAgIHZhciBsaW5lTm9kZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGluZU5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpbmVTaXplW2RpcmVjdGlvbl0gPSBNYXRoLm1heChsaW5lU2l6ZVtkaXJlY3Rpb25dLCBsaW5lTm9kZXNbaV0uc2l6ZVtkaXJlY3Rpb25dKTtcbiAgICAgICAgbGluZVNpemVbbGluZURpcmVjdGlvbl0gKz0gKGkgPiAwID8gc3BhY2luZ1tsaW5lRGlyZWN0aW9uXSA6IDApICsgbGluZU5vZGVzW2ldLnNpemVbbGluZURpcmVjdGlvbl07XG4gICAgfVxuICAgIHZhciBqdXN0aWZ5T2Zmc2V0ID0ganVzdGlmeVtsaW5lRGlyZWN0aW9uXSA/IChsaW5lTGVuZ3RoIC0gbGluZVNpemVbbGluZURpcmVjdGlvbl0pIC8gKGxpbmVOb2Rlcy5sZW5ndGggKiAyKSA6IDA7XG4gICAgdmFyIGxpbmVPZmZzZXQgPSAoZGlyZWN0aW9uID8gbWFyZ2luc1szXSA6IG1hcmdpbnNbMF0pICsganVzdGlmeU9mZnNldDtcbiAgICB2YXIgc2Nyb2xsTGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsaW5lTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGluZU5vZGUgPSBsaW5lTm9kZXNbaV07XG4gICAgICAgIHZhciB0cmFuc2xhdGUgPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgIHRyYW5zbGF0ZVtsaW5lRGlyZWN0aW9uXSA9IGxpbmVPZmZzZXQ7XG4gICAgICAgIHRyYW5zbGF0ZVtkaXJlY3Rpb25dID0gbmV4dCA/IG9mZnNldCA6IG9mZnNldCAtIGxpbmVTaXplW2RpcmVjdGlvbl07XG4gICAgICAgIHNjcm9sbExlbmd0aCA9IDA7XG4gICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICBzY3JvbGxMZW5ndGggPSBsaW5lU2l6ZVtkaXJlY3Rpb25dO1xuICAgICAgICAgICAgaWYgKGVuZFJlYWNoZWQgJiYgKG5leHQgJiYgIWFsaWdubWVudCB8fCAhbmV4dCAmJiBhbGlnbm1lbnQpKSB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoICs9IGRpcmVjdGlvbiA/IG1hcmdpbnNbMF0gKyBtYXJnaW5zWzJdIDogbWFyZ2luc1szXSArIG1hcmdpbnNbMV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNjcm9sbExlbmd0aCArPSBzcGFjaW5nW2RpcmVjdGlvbl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGluZU5vZGUuc2V0ID0ge1xuICAgICAgICAgICAgc2l6ZTogbGluZU5vZGUuc2l6ZSxcbiAgICAgICAgICAgIHRyYW5zbGF0ZTogdHJhbnNsYXRlLFxuICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoOiBzY3JvbGxMZW5ndGhcbiAgICAgICAgfTtcbiAgICAgICAgbGluZU9mZnNldCArPSBsaW5lTm9kZS5zaXplW2xpbmVEaXJlY3Rpb25dICsgc3BhY2luZ1tsaW5lRGlyZWN0aW9uXSArIGp1c3RpZnlPZmZzZXQgKiAyO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGluZU5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpbmVOb2RlID0gbmV4dCA/IGxpbmVOb2Rlc1tpXSA6IGxpbmVOb2Rlc1tsaW5lTm9kZXMubGVuZ3RoIC0gMSAtIGldO1xuICAgICAgICBjb250ZXh0LnNldChsaW5lTm9kZS5ub2RlLCBsaW5lTm9kZS5zZXQpO1xuICAgIH1cbiAgICBsaW5lTm9kZXMgPSBbXTtcbiAgICByZXR1cm4gbGluZVNpemVbZGlyZWN0aW9uXSArIHNwYWNpbmdbZGlyZWN0aW9uXTtcbn1cbmZ1bmN0aW9uIF9yZXNvbHZlTm9kZVNpemUobm9kZSkge1xuICAgIHZhciBsb2NhbEl0ZW1TaXplID0gaXRlbVNpemU7XG4gICAgaWYgKGdldEl0ZW1TaXplKSB7XG4gICAgICAgIGxvY2FsSXRlbVNpemUgPSBnZXRJdGVtU2l6ZShub2RlLnJlbmRlck5vZGUsIHNpemUpO1xuICAgIH1cbiAgICBpZiAobG9jYWxJdGVtU2l6ZVswXSA9PT0gdHJ1ZSB8fCBsb2NhbEl0ZW1TaXplWzFdID09PSB0cnVlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBjb250ZXh0LnJlc29sdmVTaXplKG5vZGUsIHNpemUpO1xuICAgICAgICBpZiAobG9jYWxJdGVtU2l6ZVswXSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgcmVzdWx0WzBdID0gaXRlbVNpemVbMF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvY2FsSXRlbVNpemVbMV0gIT09IHRydWUpIHtcbiAgICAgICAgICAgIHJlc3VsdFsxXSA9IGl0ZW1TaXplWzFdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsSXRlbVNpemU7XG4gICAgfVxufVxuZnVuY3Rpb24gQ29sbGVjdGlvbkxheW91dChjb250ZXh0Xywgb3B0aW9ucykge1xuICAgIGNvbnRleHQgPSBjb250ZXh0XztcbiAgICBzaXplID0gY29udGV4dC5zaXplO1xuICAgIGRpcmVjdGlvbiA9IGNvbnRleHQuZGlyZWN0aW9uO1xuICAgIGFsaWdubWVudCA9IGNvbnRleHQuYWxpZ25tZW50O1xuICAgIGxpbmVEaXJlY3Rpb24gPSAoZGlyZWN0aW9uICsgMSkgJSAyO1xuICAgIGlmIChvcHRpb25zLmd1dHRlciAhPT0gdW5kZWZpbmVkICYmIGNvbnNvbGUud2Fybikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ2d1dHRlciBoYXMgYmVlbiBkZXByZWNhdGVkIGZvciBDb2xsZWN0aW9uTGF5b3V0LCB1c2UgbWFyZ2lucyAmIHNwYWNpbmcgaW5zdGVhZCcpO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5ndXR0ZXIgJiYgIW9wdGlvbnMubWFyZ2lucyAmJiAhb3B0aW9ucy5zcGFjaW5nKSB7XG4gICAgICAgIHZhciBndXR0ZXIgPSBBcnJheS5pc0FycmF5KG9wdGlvbnMuZ3V0dGVyKSA/IG9wdGlvbnMuZ3V0dGVyIDogW1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuZ3V0dGVyLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMuZ3V0dGVyXG4gICAgICAgICAgICBdO1xuICAgICAgICBtYXJnaW5zID0gW1xuICAgICAgICAgICAgZ3V0dGVyWzFdLFxuICAgICAgICAgICAgZ3V0dGVyWzBdLFxuICAgICAgICAgICAgZ3V0dGVyWzFdLFxuICAgICAgICAgICAgZ3V0dGVyWzBdXG4gICAgICAgIF07XG4gICAgICAgIHNwYWNpbmcgPSBndXR0ZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbWFyZ2lucyA9IExheW91dFV0aWxpdHkubm9ybWFsaXplTWFyZ2lucyhvcHRpb25zLm1hcmdpbnMpO1xuICAgICAgICBzcGFjaW5nID0gb3B0aW9ucy5zcGFjaW5nIHx8IDA7XG4gICAgICAgIHNwYWNpbmcgPSBBcnJheS5pc0FycmF5KHNwYWNpbmcpID8gc3BhY2luZyA6IFtcbiAgICAgICAgICAgIHNwYWNpbmcsXG4gICAgICAgICAgICBzcGFjaW5nXG4gICAgICAgIF07XG4gICAgfVxuICAgIG1hcmdpblswXSA9IG1hcmdpbnNbZGlyZWN0aW9uID8gMCA6IDNdO1xuICAgIG1hcmdpblsxXSA9IC1tYXJnaW5zW2RpcmVjdGlvbiA/IDIgOiAxXTtcbiAgICBqdXN0aWZ5ID0gQXJyYXkuaXNBcnJheShvcHRpb25zLmp1c3RpZnkpID8gb3B0aW9ucy5qdXN0aWZ5IDogb3B0aW9ucy5qdXN0aWZ5ID8gW1xuICAgICAgICB0cnVlLFxuICAgICAgICB0cnVlXG4gICAgXSA6IFtcbiAgICAgICAgZmFsc2UsXG4gICAgICAgIGZhbHNlXG4gICAgXTtcbiAgICBsaW5lTGVuZ3RoID0gc2l6ZVtsaW5lRGlyZWN0aW9uXSAtIChkaXJlY3Rpb24gPyBtYXJnaW5zWzNdICsgbWFyZ2luc1sxXSA6IG1hcmdpbnNbMF0gKyBtYXJnaW5zWzJdKTtcbiAgICB2YXIgbm9kZTtcbiAgICB2YXIgbm9kZVNpemU7XG4gICAgdmFyIGxpbmVPZmZzZXQ7XG4gICAgdmFyIGJvdW5kO1xuICAgIGlmICghb3B0aW9ucy5pdGVtU2l6ZSkge1xuICAgICAgICBpdGVtU2l6ZSA9IFtcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgIF07XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLml0ZW1TaXplIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgZ2V0SXRlbVNpemUgPSBvcHRpb25zLml0ZW1TaXplO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5pdGVtU2l6ZVswXSA9PT0gdW5kZWZpbmVkIHx8IG9wdGlvbnMuaXRlbVNpemVbMF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpdGVtU2l6ZSA9IFtcbiAgICAgICAgICAgIG9wdGlvbnMuaXRlbVNpemVbMF0gPT09IHVuZGVmaW5lZCA/IHNpemVbMF0gOiBvcHRpb25zLml0ZW1TaXplWzBdLFxuICAgICAgICAgICAgb3B0aW9ucy5pdGVtU2l6ZVsxXSA9PT0gdW5kZWZpbmVkID8gc2l6ZVsxXSA6IG9wdGlvbnMuaXRlbVNpemVbMV1cbiAgICAgICAgXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgfVxuICAgIG9mZnNldCA9IGNvbnRleHQuc2Nyb2xsT2Zmc2V0ICsgbWFyZ2luW2FsaWdubWVudF07XG4gICAgYm91bmQgPSBjb250ZXh0LnNjcm9sbEVuZCArIG1hcmdpblthbGlnbm1lbnRdO1xuICAgIGxpbmVPZmZzZXQgPSAwO1xuICAgIGxpbmVOb2RlcyA9IFtdO1xuICAgIHdoaWxlIChvZmZzZXQgPCBib3VuZCkge1xuICAgICAgICBub2RlID0gY29udGV4dC5uZXh0KCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgX2xheW91dExpbmUodHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlU2l6ZSA9IF9yZXNvbHZlTm9kZVNpemUobm9kZSk7XG4gICAgICAgIGxpbmVPZmZzZXQgKz0gKGxpbmVOb2Rlcy5sZW5ndGggPyBzcGFjaW5nW2xpbmVEaXJlY3Rpb25dIDogMCkgKyBub2RlU2l6ZVtsaW5lRGlyZWN0aW9uXTtcbiAgICAgICAgaWYgKGxpbmVPZmZzZXQgPiBsaW5lTGVuZ3RoKSB7XG4gICAgICAgICAgICBvZmZzZXQgKz0gX2xheW91dExpbmUodHJ1ZSwgIW5vZGUpO1xuICAgICAgICAgICAgbGluZU9mZnNldCA9IG5vZGVTaXplW2xpbmVEaXJlY3Rpb25dO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVOb2Rlcy5wdXNoKHtcbiAgICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgICBzaXplOiBub2RlU2l6ZVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgb2Zmc2V0ID0gY29udGV4dC5zY3JvbGxPZmZzZXQgKyBtYXJnaW5bYWxpZ25tZW50XTtcbiAgICBib3VuZCA9IGNvbnRleHQuc2Nyb2xsU3RhcnQgKyBtYXJnaW5bYWxpZ25tZW50XTtcbiAgICBsaW5lT2Zmc2V0ID0gMDtcbiAgICBsaW5lTm9kZXMgPSBbXTtcbiAgICB3aGlsZSAob2Zmc2V0ID4gYm91bmQpIHtcbiAgICAgICAgbm9kZSA9IGNvbnRleHQucHJldigpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIF9sYXlvdXRMaW5lKGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVTaXplID0gX3Jlc29sdmVOb2RlU2l6ZShub2RlKTtcbiAgICAgICAgbGluZU9mZnNldCArPSAobGluZU5vZGVzLmxlbmd0aCA/IHNwYWNpbmdbbGluZURpcmVjdGlvbl0gOiAwKSArIG5vZGVTaXplW2xpbmVEaXJlY3Rpb25dO1xuICAgICAgICBpZiAobGluZU9mZnNldCA+IGxpbmVMZW5ndGgpIHtcbiAgICAgICAgICAgIG9mZnNldCAtPSBfbGF5b3V0TGluZShmYWxzZSwgIW5vZGUpO1xuICAgICAgICAgICAgbGluZU9mZnNldCA9IG5vZGVTaXplW2xpbmVEaXJlY3Rpb25dO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVOb2Rlcy51bnNoaWZ0KHtcbiAgICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgICBzaXplOiBub2RlU2l6ZVxuICAgICAgICB9KTtcbiAgICB9XG59XG5Db2xsZWN0aW9uTGF5b3V0LkNhcGFiaWxpdGllcyA9IGNhcGFiaWxpdGllcztcbkNvbGxlY3Rpb25MYXlvdXQuTmFtZSA9ICdDb2xsZWN0aW9uTGF5b3V0JztcbkNvbGxlY3Rpb25MYXlvdXQuRGVzY3JpcHRpb24gPSAnTXVsdGktY2VsbCBjb2xsZWN0aW9uLWxheW91dCB3aXRoIG1hcmdpbnMgJiBzcGFjaW5nJztcbm1vZHVsZS5leHBvcnRzID0gQ29sbGVjdGlvbkxheW91dDsiLCJ2YXIgVXRpbGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IG51bGw7XG52YXIgY2FwYWJpbGl0aWVzID0ge1xuICAgICAgICBzZXF1ZW5jZTogdHJ1ZSxcbiAgICAgICAgZGlyZWN0aW9uOiBbXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5YLFxuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWVxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxpbmc6IHRydWVcbiAgICB9O1xuZnVuY3Rpb24gQ292ZXJMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBub2RlID0gY29udGV4dC5uZXh0KCk7XG4gICAgaWYgKCFub2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHNpemUgPSBjb250ZXh0LnNpemU7XG4gICAgdmFyIGRpcmVjdGlvbiA9IGNvbnRleHQuZGlyZWN0aW9uO1xuICAgIHZhciBpdGVtU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgdmFyIG9wYWNpdHlTdGVwID0gMC4yO1xuICAgIHZhciBzY2FsZVN0ZXAgPSAwLjE7XG4gICAgdmFyIHRyYW5zbGF0ZVN0ZXAgPSAzMDtcbiAgICB2YXIgelN0YXJ0ID0gMTAwO1xuICAgIGNvbnRleHQuc2V0KG5vZGUsIHtcbiAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgMC41XG4gICAgICAgIF0sXG4gICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAwLjVcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIHpTdGFydFxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxMZW5ndGg6IGl0ZW1TaXplW2RpcmVjdGlvbl1cbiAgICB9KTtcbiAgICB2YXIgdHJhbnNsYXRlID0gaXRlbVNpemVbMF0gLyAyO1xuICAgIHZhciBvcGFjaXR5ID0gMSAtIG9wYWNpdHlTdGVwO1xuICAgIHZhciB6SW5kZXggPSB6U3RhcnQgLSAxO1xuICAgIHZhciBzY2FsZSA9IDEgLSBzY2FsZVN0ZXA7XG4gICAgdmFyIHByZXYgPSBmYWxzZTtcbiAgICB2YXIgZW5kUmVhY2hlZCA9IGZhbHNlO1xuICAgIG5vZGUgPSBjb250ZXh0Lm5leHQoKTtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgbm9kZSA9IGNvbnRleHQucHJldigpO1xuICAgICAgICBwcmV2ID0gdHJ1ZTtcbiAgICB9XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgY29udGV4dC5zZXQobm9kZSwge1xuICAgICAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAgICAgMC41XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgYWxpZ246IFtcbiAgICAgICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAgICAgMC41XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdHJhbnNsYXRlOiBkaXJlY3Rpb24gPyBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICBwcmV2ID8gLXRyYW5zbGF0ZSA6IHRyYW5zbGF0ZSxcbiAgICAgICAgICAgICAgICB6SW5kZXhcbiAgICAgICAgICAgIF0gOiBbXG4gICAgICAgICAgICAgICAgcHJldiA/IC10cmFuc2xhdGUgOiB0cmFuc2xhdGUsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB6SW5kZXhcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBzY2FsZTogW1xuICAgICAgICAgICAgICAgIHNjYWxlLFxuICAgICAgICAgICAgICAgIHNjYWxlLFxuICAgICAgICAgICAgICAgIDFcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBvcGFjaXR5OiBvcGFjaXR5LFxuICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoOiBpdGVtU2l6ZVtkaXJlY3Rpb25dXG4gICAgICAgIH0pO1xuICAgICAgICBvcGFjaXR5IC09IG9wYWNpdHlTdGVwO1xuICAgICAgICBzY2FsZSAtPSBzY2FsZVN0ZXA7XG4gICAgICAgIHRyYW5zbGF0ZSArPSB0cmFuc2xhdGVTdGVwO1xuICAgICAgICB6SW5kZXgtLTtcbiAgICAgICAgaWYgKHRyYW5zbGF0ZSA+PSBzaXplW2RpcmVjdGlvbl0gLyAyKSB7XG4gICAgICAgICAgICBlbmRSZWFjaGVkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUgPSBwcmV2ID8gY29udGV4dC5wcmV2KCkgOiBjb250ZXh0Lm5leHQoKTtcbiAgICAgICAgICAgIGVuZFJlYWNoZWQgPSAhbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW5kUmVhY2hlZCkge1xuICAgICAgICAgICAgaWYgKHByZXYpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVuZFJlYWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHByZXYgPSB0cnVlO1xuICAgICAgICAgICAgbm9kZSA9IGNvbnRleHQucHJldigpO1xuICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGUgPSBpdGVtU2l6ZVtkaXJlY3Rpb25dIC8gMjtcbiAgICAgICAgICAgICAgICBvcGFjaXR5ID0gMSAtIG9wYWNpdHlTdGVwO1xuICAgICAgICAgICAgICAgIHpJbmRleCA9IHpTdGFydCAtIDE7XG4gICAgICAgICAgICAgICAgc2NhbGUgPSAxIC0gc2NhbGVTdGVwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuQ292ZXJMYXlvdXQuQ2FwYWJpbGl0aWVzID0gY2FwYWJpbGl0aWVzO1xubW9kdWxlLmV4cG9ydHMgPSBDb3ZlckxheW91dDsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEN1YmVMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBpdGVtU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgY29udGV4dC5zZXQoY29udGV4dC5uZXh0KCksIHtcbiAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgMC41XG4gICAgICAgIF0sXG4gICAgICAgIHJvdGF0ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIE1hdGguUEkgLyAyLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIGl0ZW1TaXplWzBdIC8gMixcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF1cbiAgICB9KTtcbiAgICBjb250ZXh0LnNldChjb250ZXh0Lm5leHQoKSwge1xuICAgICAgICBzaXplOiBpdGVtU2l6ZSxcbiAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAwLjVcbiAgICAgICAgXSxcbiAgICAgICAgcm90YXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgTWF0aC5QSSAvIDIsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgLShpdGVtU2l6ZVswXSAvIDIpLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXVxuICAgIH0pO1xuICAgIGNvbnRleHQuc2V0KGNvbnRleHQubmV4dCgpLCB7XG4gICAgICAgIHNpemU6IGl0ZW1TaXplLFxuICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgIDAuNSxcbiAgICAgICAgICAgIDAuNVxuICAgICAgICBdLFxuICAgICAgICByb3RhdGU6IFtcbiAgICAgICAgICAgIE1hdGguUEkgLyAyLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgLShpdGVtU2l6ZVsxXSAvIDIpLFxuICAgICAgICAgICAgMFxuICAgICAgICBdXG4gICAgfSk7XG4gICAgY29udGV4dC5zZXQoY29udGV4dC5uZXh0KCksIHtcbiAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgMC41XG4gICAgICAgIF0sXG4gICAgICAgIHJvdGF0ZTogW1xuICAgICAgICAgICAgTWF0aC5QSSAvIDIsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICBpdGVtU2l6ZVsxXSAvIDIsXG4gICAgICAgICAgICAwXG4gICAgICAgIF1cbiAgICB9KTtcbn07IiwidmFyIFV0aWxpdHkgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiBudWxsO1xudmFyIExheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgY2FwYWJpbGl0aWVzID0ge1xuICAgICAgICBzZXF1ZW5jZTogdHJ1ZSxcbiAgICAgICAgZGlyZWN0aW9uOiBbXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5ZLFxuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWFxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxpbmc6IGZhbHNlXG4gICAgfTtcbmZ1bmN0aW9uIEdyaWRMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBzaXplID0gY29udGV4dC5zaXplO1xuICAgIGlmIChvcHRpb25zLmd1dHRlciAhPT0gdW5kZWZpbmVkICYmIGNvbnNvbGUud2Fybikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ2d1dHRlciBoYXMgYmVlbiBkZXByZWNhdGVkIGZvciBHcmlkTGF5b3V0LCB1c2UgbWFyZ2lucyAmIHNwYWNpbmcgaW5zdGVhZCcpO1xuICAgIH1cbiAgICB2YXIgc3BhY2luZztcbiAgICBpZiAob3B0aW9ucy5ndXR0ZXIgJiYgIW9wdGlvbnMuc3BhY2luZykge1xuICAgICAgICBzcGFjaW5nID0gb3B0aW9ucy5ndXR0ZXIgfHwgMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzcGFjaW5nID0gb3B0aW9ucy5zcGFjaW5nIHx8IDA7XG4gICAgfVxuICAgIHNwYWNpbmcgPSBBcnJheS5pc0FycmF5KHNwYWNpbmcpID8gc3BhY2luZyA6IFtcbiAgICAgICAgc3BhY2luZyxcbiAgICAgICAgc3BhY2luZ1xuICAgIF07XG4gICAgdmFyIG1hcmdpbnMgPSBMYXlvdXRVdGlsaXR5Lm5vcm1hbGl6ZU1hcmdpbnMob3B0aW9ucy5tYXJnaW5zKTtcbiAgICB2YXIgbm9kZVNpemUgPSBbXG4gICAgICAgICAgICAoc2l6ZVswXSAtICgob3B0aW9ucy5jZWxsc1swXSAtIDEpICogc3BhY2luZ1swXSArIG1hcmdpbnNbMV0gKyBtYXJnaW5zWzNdKSkgLyBvcHRpb25zLmNlbGxzWzBdLFxuICAgICAgICAgICAgKHNpemVbMV0gLSAoKG9wdGlvbnMuY2VsbHNbMV0gLSAxKSAqIHNwYWNpbmdbMV0gKyBtYXJnaW5zWzBdICsgbWFyZ2luc1syXSkpIC8gb3B0aW9ucy5jZWxsc1sxXVxuICAgICAgICBdO1xuICAgIGZ1bmN0aW9uIF9sYXlvdXROb2RlKG5vZGUsIGNvbCwgcm93KSB7XG4gICAgICAgIGNvbnRleHQuc2V0KG5vZGUsIHtcbiAgICAgICAgICAgIHNpemU6IG5vZGVTaXplLFxuICAgICAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAgICAgKG5vZGVTaXplWzBdICsgc3BhY2luZ1swXSkgKiBjb2wgKyBtYXJnaW5zWzNdLFxuICAgICAgICAgICAgICAgIChub2RlU2l6ZVsxXSArIHNwYWNpbmdbMV0pICogcm93ICsgbWFyZ2luc1swXSxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB2YXIgcm93O1xuICAgIHZhciBjb2w7XG4gICAgdmFyIG5vZGU7XG4gICAgaWYgKGNvbnRleHQuZGlyZWN0aW9uID09PSBVdGlsaXR5LkRpcmVjdGlvbi5ZKSB7XG4gICAgICAgIGZvciAoY29sID0gMDsgY29sIDwgb3B0aW9ucy5jZWxsc1swXTsgY29sKyspIHtcbiAgICAgICAgICAgIGZvciAocm93ID0gMDsgcm93IDwgb3B0aW9ucy5jZWxsc1sxXTsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBub2RlID0gY29udGV4dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX2xheW91dE5vZGUobm9kZSwgY29sLCByb3cpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChyb3cgPSAwOyByb3cgPCBvcHRpb25zLmNlbGxzWzFdOyByb3crKykge1xuICAgICAgICAgICAgZm9yIChjb2wgPSAwOyBjb2wgPCBvcHRpb25zLmNlbGxzWzBdOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBjb250ZXh0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfbGF5b3V0Tm9kZShub2RlLCBjb2wsIHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5HcmlkTGF5b3V0LkNhcGFiaWxpdGllcyA9IGNhcGFiaWxpdGllcztcbm1vZHVsZS5leHBvcnRzID0gR3JpZExheW91dDsiLCJ2YXIgTGF5b3V0RG9ja0hlbHBlciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvTGF5b3V0RG9ja0hlbHBlcicpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBIZWFkZXJGb290ZXJMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBkb2NrID0gbmV3IExheW91dERvY2tIZWxwZXIoY29udGV4dCwgb3B0aW9ucyk7XG4gICAgZG9jay50b3AoJ2hlYWRlcicsIG9wdGlvbnMuaGVhZGVyU2l6ZSB8fCBvcHRpb25zLmhlYWRlckhlaWdodCk7XG4gICAgZG9jay5ib3R0b20oJ2Zvb3RlcicsIG9wdGlvbnMuZm9vdGVyU2l6ZSB8fCBvcHRpb25zLmZvb3RlckhlaWdodCk7XG4gICAgZG9jay5maWxsKCdjb250ZW50Jyk7XG59OyIsInZhciBVdGlsaXR5ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnV0aWxpdGllcy5VdGlsaXR5IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnV0aWxpdGllcy5VdGlsaXR5IDogbnVsbDtcbnZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi4vTGF5b3V0VXRpbGl0eScpO1xudmFyIGNhcGFiaWxpdGllcyA9IHtcbiAgICAgICAgc2VxdWVuY2U6IHRydWUsXG4gICAgICAgIGRpcmVjdGlvbjogW1xuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWSxcbiAgICAgICAgICAgIFV0aWxpdHkuRGlyZWN0aW9uLlhcbiAgICAgICAgXSxcbiAgICAgICAgc2Nyb2xsaW5nOiB0cnVlLFxuICAgICAgICB0cnVlU2l6ZTogdHJ1ZSxcbiAgICAgICAgc2VxdWVudGlhbFNjcm9sbGluZ09wdGltaXplZDogdHJ1ZVxuICAgIH07XG52YXIgc2V0ID0ge1xuICAgICAgICBzaXplOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxMZW5ndGg6IHVuZGVmaW5lZFxuICAgIH07XG52YXIgbWFyZ2luID0gW1xuICAgICAgICAwLFxuICAgICAgICAwXG4gICAgXTtcbmZ1bmN0aW9uIExpc3RMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBzaXplID0gY29udGV4dC5zaXplO1xuICAgIHZhciBkaXJlY3Rpb24gPSBjb250ZXh0LmRpcmVjdGlvbjtcbiAgICB2YXIgYWxpZ25tZW50ID0gY29udGV4dC5hbGlnbm1lbnQ7XG4gICAgdmFyIHJldkRpcmVjdGlvbiA9IGRpcmVjdGlvbiA/IDAgOiAxO1xuICAgIHZhciBvZmZzZXQ7XG4gICAgdmFyIG1hcmdpbnMgPSBMYXlvdXRVdGlsaXR5Lm5vcm1hbGl6ZU1hcmdpbnMob3B0aW9ucy5tYXJnaW5zKTtcbiAgICB2YXIgc3BhY2luZyA9IG9wdGlvbnMuc3BhY2luZyB8fCAwO1xuICAgIHZhciBub2RlO1xuICAgIHZhciBub2RlU2l6ZTtcbiAgICB2YXIgaXRlbVNpemU7XG4gICAgdmFyIGdldEl0ZW1TaXplO1xuICAgIHZhciBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsO1xuICAgIHZhciBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsT2Zmc2V0O1xuICAgIHZhciBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsTGVuZ3RoO1xuICAgIHZhciBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsU2Nyb2xsTGVuZ3RoO1xuICAgIHZhciBmaXJzdFZpc2libGVDZWxsO1xuICAgIHZhciBsYXN0Tm9kZTtcbiAgICB2YXIgbGFzdENlbGxPZmZzZXRJbkZpcnN0VmlzaWJsZVNlY3Rpb247XG4gICAgdmFyIGlzU2VjdGlvbkNhbGxiYWNrID0gb3B0aW9ucy5pc1NlY3Rpb25DYWxsYmFjaztcbiAgICB2YXIgYm91bmQ7XG4gICAgc2V0LnNpemVbMF0gPSBzaXplWzBdO1xuICAgIHNldC5zaXplWzFdID0gc2l6ZVsxXTtcbiAgICBzZXQuc2l6ZVtyZXZEaXJlY3Rpb25dIC09IG1hcmdpbnNbMSAtIHJldkRpcmVjdGlvbl0gKyBtYXJnaW5zWzMgLSByZXZEaXJlY3Rpb25dO1xuICAgIHNldC50cmFuc2xhdGVbMF0gPSAwO1xuICAgIHNldC50cmFuc2xhdGVbMV0gPSAwO1xuICAgIHNldC50cmFuc2xhdGVbMl0gPSAwO1xuICAgIHNldC50cmFuc2xhdGVbcmV2RGlyZWN0aW9uXSA9IG1hcmdpbnNbZGlyZWN0aW9uID8gMyA6IDBdO1xuICAgIGlmIChvcHRpb25zLml0ZW1TaXplID09PSB0cnVlIHx8ICFvcHRpb25zLmhhc093blByb3BlcnR5KCdpdGVtU2l6ZScpKSB7XG4gICAgICAgIGl0ZW1TaXplID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuaXRlbVNpemUgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICBnZXRJdGVtU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbVNpemUgPSBvcHRpb25zLml0ZW1TaXplID09PSB1bmRlZmluZWQgPyBzaXplW2RpcmVjdGlvbl0gOiBvcHRpb25zLml0ZW1TaXplO1xuICAgIH1cbiAgICBtYXJnaW5bMF0gPSBtYXJnaW5zW2RpcmVjdGlvbiA/IDAgOiAzXTtcbiAgICBtYXJnaW5bMV0gPSAtbWFyZ2luc1tkaXJlY3Rpb24gPyAyIDogMV07XG4gICAgb2Zmc2V0ID0gY29udGV4dC5zY3JvbGxPZmZzZXQgKyBtYXJnaW5bYWxpZ25tZW50XTtcbiAgICBib3VuZCA9IGNvbnRleHQuc2Nyb2xsRW5kICsgbWFyZ2luW2FsaWdubWVudF07XG4gICAgd2hpbGUgKG9mZnNldCA8IGJvdW5kKSB7XG4gICAgICAgIGxhc3ROb2RlID0gbm9kZTtcbiAgICAgICAgbm9kZSA9IGNvbnRleHQubmV4dCgpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIGlmIChsYXN0Tm9kZSAmJiAhYWxpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgc2V0LnNjcm9sbExlbmd0aCA9IG5vZGVTaXplICsgbWFyZ2luWzBdICsgLW1hcmdpblsxXTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnNldChsYXN0Tm9kZSwgc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVTaXplID0gZ2V0SXRlbVNpemUgPyBnZXRJdGVtU2l6ZShub2RlLnJlbmRlck5vZGUpIDogaXRlbVNpemU7XG4gICAgICAgIG5vZGVTaXplID0gbm9kZVNpemUgPT09IHRydWUgPyBjb250ZXh0LnJlc29sdmVTaXplKG5vZGUsIHNpemUpW2RpcmVjdGlvbl0gOiBub2RlU2l6ZTtcbiAgICAgICAgc2V0LnNpemVbZGlyZWN0aW9uXSA9IG5vZGVTaXplO1xuICAgICAgICBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0gPSBvZmZzZXQgKyAoYWxpZ25tZW50ID8gc3BhY2luZyA6IDApO1xuICAgICAgICBzZXQuc2Nyb2xsTGVuZ3RoID0gbm9kZVNpemUgKyBzcGFjaW5nO1xuICAgICAgICBjb250ZXh0LnNldChub2RlLCBzZXQpO1xuICAgICAgICBvZmZzZXQgKz0gc2V0LnNjcm9sbExlbmd0aDtcbiAgICAgICAgaWYgKGlzU2VjdGlvbkNhbGxiYWNrICYmIGlzU2VjdGlvbkNhbGxiYWNrKG5vZGUucmVuZGVyTm9kZSkpIHtcbiAgICAgICAgICAgIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSA9IE1hdGgubWF4KG1hcmdpblswXSwgc2V0LnRyYW5zbGF0ZVtkaXJlY3Rpb25dKTtcbiAgICAgICAgICAgIGNvbnRleHQuc2V0KG5vZGUsIHNldCk7XG4gICAgICAgICAgICBpZiAoIWZpcnN0VmlzaWJsZUNlbGwpIHtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsID0gbm9kZTtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsT2Zmc2V0ID0gb2Zmc2V0IC0gbm9kZVNpemU7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbExlbmd0aCA9IG5vZGVTaXplO1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxTY3JvbGxMZW5ndGggPSBub2RlU2l6ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdENlbGxPZmZzZXRJbkZpcnN0VmlzaWJsZVNlY3Rpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGxhc3RDZWxsT2Zmc2V0SW5GaXJzdFZpc2libGVTZWN0aW9uID0gb2Zmc2V0IC0gbm9kZVNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWZpcnN0VmlzaWJsZUNlbGwgJiYgb2Zmc2V0ID49IDApIHtcbiAgICAgICAgICAgIGZpcnN0VmlzaWJsZUNlbGwgPSBub2RlO1xuICAgICAgICB9XG4gICAgfVxuICAgIG5vZGUgPSB1bmRlZmluZWQ7XG4gICAgb2Zmc2V0ID0gY29udGV4dC5zY3JvbGxPZmZzZXQgKyBtYXJnaW5bYWxpZ25tZW50XTtcbiAgICBib3VuZCA9IGNvbnRleHQuc2Nyb2xsU3RhcnQgKyBtYXJnaW5bYWxpZ25tZW50XTtcbiAgICB3aGlsZSAob2Zmc2V0ID4gYm91bmQpIHtcbiAgICAgICAgbGFzdE5vZGUgPSBub2RlO1xuICAgICAgICBub2RlID0gY29udGV4dC5wcmV2KCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgaWYgKGxhc3ROb2RlICYmIGFsaWdubWVudCkge1xuICAgICAgICAgICAgICAgIHNldC5zY3JvbGxMZW5ndGggPSBub2RlU2l6ZSArIG1hcmdpblswXSArIC1tYXJnaW5bMV07XG4gICAgICAgICAgICAgICAgY29udGV4dC5zZXQobGFzdE5vZGUsIHNldCk7XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGwgPT09IGxhc3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxTY3JvbGxMZW5ndGggPSBzZXQuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVTaXplID0gZ2V0SXRlbVNpemUgPyBnZXRJdGVtU2l6ZShub2RlLnJlbmRlck5vZGUpIDogaXRlbVNpemU7XG4gICAgICAgIG5vZGVTaXplID0gbm9kZVNpemUgPT09IHRydWUgPyBjb250ZXh0LnJlc29sdmVTaXplKG5vZGUsIHNpemUpW2RpcmVjdGlvbl0gOiBub2RlU2l6ZTtcbiAgICAgICAgc2V0LnNjcm9sbExlbmd0aCA9IG5vZGVTaXplICsgc3BhY2luZztcbiAgICAgICAgb2Zmc2V0IC09IHNldC5zY3JvbGxMZW5ndGg7XG4gICAgICAgIHNldC5zaXplW2RpcmVjdGlvbl0gPSBub2RlU2l6ZTtcbiAgICAgICAgc2V0LnRyYW5zbGF0ZVtkaXJlY3Rpb25dID0gb2Zmc2V0ICsgKGFsaWdubWVudCA/IHNwYWNpbmcgOiAwKTtcbiAgICAgICAgY29udGV4dC5zZXQobm9kZSwgc2V0KTtcbiAgICAgICAgaWYgKGlzU2VjdGlvbkNhbGxiYWNrICYmIGlzU2VjdGlvbkNhbGxiYWNrKG5vZGUucmVuZGVyTm9kZSkpIHtcbiAgICAgICAgICAgIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSA9IE1hdGgubWF4KG1hcmdpblswXSwgc2V0LnRyYW5zbGF0ZVtkaXJlY3Rpb25dKTtcbiAgICAgICAgICAgIGNvbnRleHQuc2V0KG5vZGUsIHNldCk7XG4gICAgICAgICAgICBpZiAoIWxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGwpIHtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsID0gbm9kZTtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsT2Zmc2V0ID0gb2Zmc2V0O1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxMZW5ndGggPSBub2RlU2l6ZTtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsU2Nyb2xsTGVuZ3RoID0gc2V0LnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChvZmZzZXQgKyBub2RlU2l6ZSA+PSAwKSB7XG4gICAgICAgICAgICBmaXJzdFZpc2libGVDZWxsID0gbm9kZTtcbiAgICAgICAgICAgIGlmIChsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsKSB7XG4gICAgICAgICAgICAgICAgbGFzdENlbGxPZmZzZXRJbkZpcnN0VmlzaWJsZVNlY3Rpb24gPSBvZmZzZXQgKyBub2RlU2l6ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzU2VjdGlvbkNhbGxiYWNrICYmICFsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsKSB7XG4gICAgICAgIG5vZGUgPSBjb250ZXh0LnByZXYoKTtcbiAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChpc1NlY3Rpb25DYWxsYmFjayhub2RlLnJlbmRlck5vZGUpKSB7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCA9IG5vZGU7XG4gICAgICAgICAgICAgICAgbm9kZVNpemUgPSBvcHRpb25zLml0ZW1TaXplIHx8IGNvbnRleHQucmVzb2x2ZVNpemUobm9kZSwgc2l6ZSlbZGlyZWN0aW9uXTtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsT2Zmc2V0ID0gb2Zmc2V0IC0gbm9kZVNpemU7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbExlbmd0aCA9IG5vZGVTaXplO1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxTY3JvbGxMZW5ndGggPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBjb250ZXh0LnByZXYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCkge1xuICAgICAgICB2YXIgY29ycmVjdGVkT2Zmc2V0ID0gTWF0aC5tYXgobWFyZ2luWzBdLCBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsT2Zmc2V0KTtcbiAgICAgICAgaWYgKGxhc3RDZWxsT2Zmc2V0SW5GaXJzdFZpc2libGVTZWN0aW9uICE9PSB1bmRlZmluZWQgJiYgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbExlbmd0aCA+IGxhc3RDZWxsT2Zmc2V0SW5GaXJzdFZpc2libGVTZWN0aW9uIC0gbWFyZ2luWzBdKSB7XG4gICAgICAgICAgICBjb3JyZWN0ZWRPZmZzZXQgPSBsYXN0Q2VsbE9mZnNldEluRmlyc3RWaXNpYmxlU2VjdGlvbiAtIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxMZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgc2V0LnNpemVbZGlyZWN0aW9uXSA9IGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxMZW5ndGg7XG4gICAgICAgIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSA9IGNvcnJlY3RlZE9mZnNldDtcbiAgICAgICAgc2V0LnNjcm9sbExlbmd0aCA9IGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxTY3JvbGxMZW5ndGg7XG4gICAgICAgIGNvbnRleHQuc2V0KGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGwsIHNldCk7XG4gICAgfVxufVxuTGlzdExheW91dC5DYXBhYmlsaXRpZXMgPSBjYXBhYmlsaXRpZXM7XG5MaXN0TGF5b3V0Lk5hbWUgPSAnTGlzdExheW91dCc7XG5MaXN0TGF5b3V0LkRlc2NyaXB0aW9uID0gJ0xpc3QtbGF5b3V0IHdpdGggbWFyZ2lucywgc3BhY2luZyBhbmQgc3RpY2t5IGhlYWRlcnMnO1xubW9kdWxlLmV4cG9ydHMgPSBMaXN0TGF5b3V0OyIsInZhciBMYXlvdXREb2NrSGVscGVyID0gcmVxdWlyZSgnLi4vaGVscGVycy9MYXlvdXREb2NrSGVscGVyJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIE5hdkJhckxheW91dChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGRvY2sgPSBuZXcgTGF5b3V0RG9ja0hlbHBlcihjb250ZXh0LCB7XG4gICAgICAgICAgICBtYXJnaW5zOiBvcHRpb25zLm1hcmdpbnMsXG4gICAgICAgICAgICB0cmFuc2xhdGVaOiAxXG4gICAgICAgIH0pO1xuICAgIGNvbnRleHQuc2V0KCdiYWNrZ3JvdW5kJywgeyBzaXplOiBjb250ZXh0LnNpemUgfSk7XG4gICAgdmFyIG5vZGU7XG4gICAgdmFyIGk7XG4gICAgdmFyIHJpZ2h0SXRlbXMgPSBjb250ZXh0LmdldCgncmlnaHRJdGVtcycpO1xuICAgIGlmIChyaWdodEl0ZW1zKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCByaWdodEl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlID0gY29udGV4dC5nZXQocmlnaHRJdGVtc1tpXSk7XG4gICAgICAgICAgICBkb2NrLnJpZ2h0KG5vZGUsIG9wdGlvbnMucmlnaHRJdGVtV2lkdGggfHwgb3B0aW9ucy5pdGVtV2lkdGgpO1xuICAgICAgICAgICAgZG9jay5yaWdodCh1bmRlZmluZWQsIG9wdGlvbnMucmlnaHRJdGVtU3BhY2VyIHx8IG9wdGlvbnMuaXRlbVNwYWNlcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGxlZnRJdGVtcyA9IGNvbnRleHQuZ2V0KCdsZWZ0SXRlbXMnKTtcbiAgICBpZiAobGVmdEl0ZW1zKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZWZ0SXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5vZGUgPSBjb250ZXh0LmdldChsZWZ0SXRlbXNbaV0pO1xuICAgICAgICAgICAgZG9jay5sZWZ0KG5vZGUsIG9wdGlvbnMubGVmdEl0ZW1XaWR0aCB8fCBvcHRpb25zLml0ZW1XaWR0aCk7XG4gICAgICAgICAgICBkb2NrLmxlZnQodW5kZWZpbmVkLCBvcHRpb25zLmxlZnRJdGVtU3BhY2VyIHx8IG9wdGlvbnMuaXRlbVNwYWNlcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZG9jay5maWxsKCd0aXRsZScpO1xufTsiXX0=
