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
            for (var i = 0; i < this._specs.length; i++) {
                var spec = this._specs[i];
                if (spec.renderNode === node) {
                    return spec;
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
                    dataSource.splice(0, 0, renderable);
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
            return this.options.size;
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
                var layoutContext = this._nodes.prepareForLayout(this._viewSequence, this._nodesById, {
                    size: size,
                    direction: this._direction
                });
                if (this._layout._function) {
                    this._layout._function(layoutContext, this._layout.options);
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
            if (this._reevalTrueSize) {
                renderNode._trueSizeCheck = true;
                renderNode._sizeDirty = true;
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
                this.container = new ContainerSurface({ properties: { overflow: this.options.useContainerOverflow } });
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
            useContainerOverflow: 'hidden',
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
            var scrollToSequence = this._scroll.scrollToSequence || this._scroll.ensureVisibleSequence;
            if (!scrollToSequence) {
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
                if (node._viewSequence === scrollToSequence) {
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
                    if (node._viewSequence === scrollToSequence) {
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
                            this._scroll.ensureVisibleSequence = undefined;
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
                            this._scroll.ensureVisibleSequence = undefined;
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
            this._scroll.ensureVisibleSequence = undefined;
            this._scroll.scrollToDirection = next;
            this._scroll.scrollDirty = true;
        }
        function _ensureVisibleSequence(viewSequence, next) {
            this._scroll.scrollToSequence = undefined;
            this._scroll.ensureVisibleSequence = viewSequence;
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
            this._scroll.ensureVisibleSequence = undefined;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJnbG9iYWwtbm8tZmFtb3VzLnRlbXBsYXRlLmpzIiwic3JjL0ZsZXhTY3JvbGxWaWV3LmpzIiwic3JjL0Zsb3dMYXlvdXROb2RlLmpzIiwic3JjL0xheW91dENvbnRleHQuanMiLCJzcmMvTGF5b3V0Q29udHJvbGxlci5qcyIsInNyYy9MYXlvdXROb2RlLmpzIiwic3JjL0xheW91dE5vZGVNYW5hZ2VyLmpzIiwic3JjL0xheW91dFV0aWxpdHkuanMiLCJzcmMvU2Nyb2xsQ29udHJvbGxlci5qcyIsInNyYy9oZWxwZXJzL0xheW91dERvY2tIZWxwZXIuanMiLCJzcmMvbGF5b3V0cy9Db2xsZWN0aW9uTGF5b3V0LmpzIiwic3JjL2xheW91dHMvQ292ZXJMYXlvdXQuanMiLCJzcmMvbGF5b3V0cy9DdWJlTGF5b3V0LmpzIiwic3JjL2xheW91dHMvR3JpZExheW91dC5qcyIsInNyYy9sYXlvdXRzL0hlYWRlckZvb3RlckxheW91dC5qcyIsInNyYy9sYXlvdXRzL0xpc3RMYXlvdXQuanMiLCJzcmMvbGF5b3V0cy9OYXZCYXJMYXlvdXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHR5cGVvZiBpanplcmVuaGVpbiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpanplcmVuaGVpbiA9IHt9O1xufVxuXG5panplcmVuaGVpbi5GbGV4U2Nyb2xsVmlldyA9IHJlcXVpcmUoJy4vc3JjL0ZsZXhTY3JvbGxWaWV3Jyk7XG5panplcmVuaGVpbi5GbG93TGF5b3V0Tm9kZSA9IHJlcXVpcmUoJy4vc3JjL0Zsb3dMYXlvdXROb2RlJyk7XG5panplcmVuaGVpbi5MYXlvdXRDb250ZXh0ID0gcmVxdWlyZSgnLi9zcmMvTGF5b3V0Q29udGV4dCcpO1xuaWp6ZXJlbmhlaW4uTGF5b3V0Q29udHJvbGxlciA9IHJlcXVpcmUoJy4vc3JjL0xheW91dENvbnRyb2xsZXInKTtcbmlqemVyZW5oZWluLkxheW91dE5vZGUgPSByZXF1aXJlKCcuL3NyYy9MYXlvdXROb2RlJyk7XG5panplcmVuaGVpbi5MYXlvdXROb2RlTWFuYWdlciA9IHJlcXVpcmUoJy4vc3JjL0xheW91dE5vZGVNYW5hZ2VyJyk7XG5panplcmVuaGVpbi5MYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi9zcmMvTGF5b3V0VXRpbGl0eScpO1xuaWp6ZXJlbmhlaW4uU2Nyb2xsQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vc3JjL1Njcm9sbENvbnRyb2xsZXInKTtcbi8vaWp6ZXJlbmhlaW4uU2Nyb2xsVmlldyA9IHJlcXVpcmUoJy4vc3JjL1Njcm9sbFZpZXcnKTtcblxuaWp6ZXJlbmhlaW4ubGF5b3V0ID0gaWp6ZXJlbmhlaW4ubGF5b3V0IHx8IHt9O1xuXG5panplcmVuaGVpbi5sYXlvdXQuQ29sbGVjdGlvbkxheW91dCA9IHJlcXVpcmUoJy4vc3JjL2xheW91dHMvQ29sbGVjdGlvbkxheW91dCcpO1xuaWp6ZXJlbmhlaW4ubGF5b3V0LkNvdmVyTGF5b3V0ID0gcmVxdWlyZSgnLi9zcmMvbGF5b3V0cy9Db3ZlckxheW91dCcpO1xuaWp6ZXJlbmhlaW4ubGF5b3V0LkN1YmVMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL0N1YmVMYXlvdXQnKTtcbmlqemVyZW5oZWluLmxheW91dC5HcmlkTGF5b3V0ID0gcmVxdWlyZSgnLi9zcmMvbGF5b3V0cy9HcmlkTGF5b3V0Jyk7XG5panplcmVuaGVpbi5sYXlvdXQuSGVhZGVyRm9vdGVyTGF5b3V0ID0gcmVxdWlyZSgnLi9zcmMvbGF5b3V0cy9IZWFkZXJGb290ZXJMYXlvdXQnKTtcbmlqemVyZW5oZWluLmxheW91dC5MaXN0TGF5b3V0ID0gcmVxdWlyZSgnLi9zcmMvbGF5b3V0cy9MaXN0TGF5b3V0Jyk7XG5panplcmVuaGVpbi5sYXlvdXQuTmF2QmFyTGF5b3V0ID0gcmVxdWlyZSgnLi9zcmMvbGF5b3V0cy9OYXZCYXJMYXlvdXQnKTtcbi8vaWp6ZXJlbmhlaW4ubGF5b3V0LlRhYmxlTGF5b3V0ID0gcmVxdWlyZSgnLi9zcmMvbGF5b3V0cy9UYWJsZUxheW91dCcpO1xuXG5panplcmVuaGVpbi5oZWxwZXJzID0gaWp6ZXJlbmhlaW4uaGVscGVycyB8fCB7fTtcblxuaWp6ZXJlbmhlaW4uaGVscGVycy5MYXlvdXREb2NrSGVscGVyID0gcmVxdWlyZSgnLi9zcmMvaGVscGVycy9MYXlvdXREb2NrSGVscGVyJyk7XG4iLCJ2YXIgTGF5b3V0VXRpbGl0eSA9IHJlcXVpcmUoJy4vTGF5b3V0VXRpbGl0eScpO1xudmFyIFNjcm9sbENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL1Njcm9sbENvbnRyb2xsZXInKTtcbnZhciBMaXN0TGF5b3V0ID0gcmVxdWlyZSgnLi9sYXlvdXRzL0xpc3RMYXlvdXQnKTtcbnZhciBQdWxsVG9SZWZyZXNoU3RhdGUgPSB7XG4gICAgICAgIEhJRERFTjogMCxcbiAgICAgICAgUFVMTElORzogMSxcbiAgICAgICAgQUNUSVZFOiAyLFxuICAgICAgICBDT01QTEVURUQ6IDMsXG4gICAgICAgIEhJRERJTkc6IDRcbiAgICB9O1xuZnVuY3Rpb24gRmxleFNjcm9sbFZpZXcob3B0aW9ucykge1xuICAgIFNjcm9sbENvbnRyb2xsZXIuY2FsbCh0aGlzLCBMYXlvdXRVdGlsaXR5LmNvbWJpbmVPcHRpb25zKEZsZXhTY3JvbGxWaWV3LkRFRkFVTFRfT1BUSU9OUywgb3B0aW9ucykpO1xuICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgPSAwO1xuICAgIHRoaXMuX2xlYWRpbmdTY3JvbGxWaWV3RGVsdGEgPSAwO1xuICAgIHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhID0gMDtcbn1cbkZsZXhTY3JvbGxWaWV3LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUpO1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmxleFNjcm9sbFZpZXc7XG5GbGV4U2Nyb2xsVmlldy5QdWxsVG9SZWZyZXNoU3RhdGUgPSBQdWxsVG9SZWZyZXNoU3RhdGU7XG5GbGV4U2Nyb2xsVmlldy5ERUZBVUxUX09QVElPTlMgPSB7XG4gICAgbGF5b3V0OiBMaXN0TGF5b3V0LFxuICAgIGRpcmVjdGlvbjogdW5kZWZpbmVkLFxuICAgIHBhZ2luYXRlZDogZmFsc2UsXG4gICAgYWxpZ25tZW50OiAwLFxuICAgIGZsb3c6IGZhbHNlLFxuICAgIG1vdXNlTW92ZTogZmFsc2UsXG4gICAgdXNlQ29udGFpbmVyOiBmYWxzZSxcbiAgICB2aXNpYmxlSXRlbVRocmVzc2hvbGQ6IDAuNSxcbiAgICBwdWxsVG9SZWZyZXNoSGVhZGVyOiB1bmRlZmluZWQsXG4gICAgcHVsbFRvUmVmcmVzaEZvb3RlcjogdW5kZWZpbmVkLFxuICAgIGxlYWRpbmdTY3JvbGxWaWV3OiB1bmRlZmluZWQsXG4gICAgdHJhaWxpbmdTY3JvbGxWaWV3OiB1bmRlZmluZWRcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuc2V0T3B0aW9ucy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIGlmIChvcHRpb25zLnB1bGxUb1JlZnJlc2hIZWFkZXIgfHwgb3B0aW9ucy5wdWxsVG9SZWZyZXNoRm9vdGVyIHx8IHRoaXMuX3B1bGxUb1JlZnJlc2gpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMucHVsbFRvUmVmcmVzaEhlYWRlcikge1xuICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaCA9IHRoaXMuX3B1bGxUb1JlZnJlc2ggfHwgW1xuICAgICAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICB1bmRlZmluZWRcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3B1bGxUb1JlZnJlc2hbMF0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wdWxsVG9SZWZyZXNoWzBdID0ge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERFTixcbiAgICAgICAgICAgICAgICAgICAgcHJldlN0YXRlOiBQdWxsVG9SZWZyZXNoU3RhdGUuSElEREVOLFxuICAgICAgICAgICAgICAgICAgICBmb290ZXI6IGZhbHNlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2hbMF0ubm9kZSA9IG9wdGlvbnMucHVsbFRvUmVmcmVzaEhlYWRlcjtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5vcHRpb25zLnB1bGxUb1JlZnJlc2hIZWFkZXIgJiYgdGhpcy5fcHVsbFRvUmVmcmVzaCkge1xuICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaFswXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5wdWxsVG9SZWZyZXNoRm9vdGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9wdWxsVG9SZWZyZXNoID0gdGhpcy5fcHVsbFRvUmVmcmVzaCB8fCBbXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHVuZGVmaW5lZFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGlmICghdGhpcy5fcHVsbFRvUmVmcmVzaFsxXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2hbMV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiBQdWxsVG9SZWZyZXNoU3RhdGUuSElEREVOLFxuICAgICAgICAgICAgICAgICAgICBwcmV2U3RhdGU6IFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4sXG4gICAgICAgICAgICAgICAgICAgIGZvb3RlcjogdHJ1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9wdWxsVG9SZWZyZXNoWzFdLm5vZGUgPSBvcHRpb25zLnB1bGxUb1JlZnJlc2hGb290ZXI7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMub3B0aW9ucy5wdWxsVG9SZWZyZXNoRm9vdGVyICYmIHRoaXMuX3B1bGxUb1JlZnJlc2gpIHtcbiAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2hbMV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3B1bGxUb1JlZnJlc2ggJiYgIXRoaXMuX3B1bGxUb1JlZnJlc2hbMF0gJiYgIXRoaXMuX3B1bGxUb1JlZnJlc2hbMV0pIHtcbiAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2ggPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLnNlcXVlbmNlRnJvbSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0RGF0YVNvdXJjZShub2RlKTtcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ2V0Q3VycmVudEluZGV4ID0gZnVuY3Rpb24gZ2V0Q3VycmVudEluZGV4KCkge1xuICAgIHZhciBpdGVtID0gdGhpcy5nZXRGaXJzdFZpc2libGVJdGVtKCk7XG4gICAgcmV0dXJuIGl0ZW0gPyBpdGVtLnZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpIDogLTE7XG59O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLmdvVG9QYWdlID0gZnVuY3Rpb24gZ29Ub1BhZ2UoaW5kZXgpIHtcbiAgICB2YXIgdmlld1NlcXVlbmNlID0gdGhpcy5fdmlld1NlcXVlbmNlO1xuICAgIGlmICghdmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB3aGlsZSAodmlld1NlcXVlbmNlLmdldEluZGV4KCkgPCBpbmRleCkge1xuICAgICAgICB2aWV3U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgICAgICBpZiAoIXZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgd2hpbGUgKHZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpID4gaW5kZXgpIHtcbiAgICAgICAgdmlld1NlcXVlbmNlID0gdmlld1NlcXVlbmNlLmdldFByZXZpb3VzKCk7XG4gICAgICAgIGlmICghdmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmdvVG9SZW5kZXJOb2RlKHZpZXdTZXF1ZW5jZS5nZXQoKSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLmdldE9mZnNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGU7XG59O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLmdldFBvc2l0aW9uID0gRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLmdldE9mZnNldDtcbmZ1bmN0aW9uIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgc3RhdGUpIHtcbiAgICBpZiAocHVsbFRvUmVmcmVzaC5zdGF0ZSAhPT0gc3RhdGUpIHtcbiAgICAgICAgcHVsbFRvUmVmcmVzaC5zdGF0ZSA9IHN0YXRlO1xuICAgICAgICBpZiAocHVsbFRvUmVmcmVzaC5ub2RlICYmIHB1bGxUb1JlZnJlc2gubm9kZS5zZXRQdWxsVG9SZWZyZXNoU3RhdHVzKSB7XG4gICAgICAgICAgICBwdWxsVG9SZWZyZXNoLm5vZGUuc2V0UHVsbFRvUmVmcmVzaFN0YXR1cyhzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBfZ2V0UHVsbFRvUmVmcmVzaChmb290ZXIpIHtcbiAgICByZXR1cm4gdGhpcy5fcHVsbFRvUmVmcmVzaCA/IHRoaXMuX3B1bGxUb1JlZnJlc2hbZm9vdGVyID8gMSA6IDBdIDogdW5kZWZpbmVkO1xufVxuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLl9wb3N0TGF5b3V0ID0gZnVuY3Rpb24gKHNpemUsIHNjcm9sbE9mZnNldCkge1xuICAgIGlmICghdGhpcy5fcHVsbFRvUmVmcmVzaCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgIHNjcm9sbE9mZnNldCArPSBzaXplW3RoaXMuX2RpcmVjdGlvbl07XG4gICAgfVxuICAgIHZhciBwcmV2SGVpZ2h0O1xuICAgIHZhciBuZXh0SGVpZ2h0O1xuICAgIHZhciB0b3RhbEhlaWdodDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI7IGkrKykge1xuICAgICAgICB2YXIgcHVsbFRvUmVmcmVzaCA9IHRoaXMuX3B1bGxUb1JlZnJlc2hbaV07XG4gICAgICAgIGlmIChwdWxsVG9SZWZyZXNoKSB7XG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gcHVsbFRvUmVmcmVzaC5ub2RlLmdldFNpemUoKVt0aGlzLl9kaXJlY3Rpb25dO1xuICAgICAgICAgICAgdmFyIHB1bGxMZW5ndGggPSBwdWxsVG9SZWZyZXNoLm5vZGUuZ2V0UHVsbFRvUmVmcmVzaFNpemUgPyBwdWxsVG9SZWZyZXNoLm5vZGUuZ2V0UHVsbFRvUmVmcmVzaFNpemUoKVt0aGlzLl9kaXJlY3Rpb25dIDogbGVuZ3RoO1xuICAgICAgICAgICAgdmFyIG9mZnNldDtcbiAgICAgICAgICAgIGlmICghcHVsbFRvUmVmcmVzaC5mb290ZXIpIHtcbiAgICAgICAgICAgICAgICBwcmV2SGVpZ2h0ID0gdGhpcy5fY2FsY1Njcm9sbEhlaWdodChmYWxzZSk7XG4gICAgICAgICAgICAgICAgcHJldkhlaWdodCA9IHByZXZIZWlnaHQgPT09IHVuZGVmaW5lZCA/IC0xIDogcHJldkhlaWdodDtcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBwcmV2SGVpZ2h0ID49IDAgPyBzY3JvbGxPZmZzZXQgLSBwcmV2SGVpZ2h0IDogcHJldkhlaWdodDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0SGVpZ2h0ID0gdGhpcy5fY2FsY1Njcm9sbEhlaWdodCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgbmV4dEhlaWdodCA9IG5leHRIZWlnaHQgPT09IHVuZGVmaW5lZCA/IC0xIDogbmV4dEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgdG90YWxIZWlnaHQgPSBwcmV2SGVpZ2h0ID49IDAgJiYgbmV4dEhlaWdodCA+PSAwID8gcHJldkhlaWdodCArIG5leHRIZWlnaHQgOiAtMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvdGFsSGVpZ2h0ID49IDAgJiYgdG90YWxIZWlnaHQgPCBzaXplW3RoaXMuX2RpcmVjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IE1hdGgucm91bmQoc2Nyb2xsT2Zmc2V0IC0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dICsgbmV4dEhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5leHRIZWlnaHQgPSBuZXh0SGVpZ2h0ID09PSB1bmRlZmluZWQgPyBuZXh0SGVpZ2h0ID0gdGhpcy5fY2FsY1Njcm9sbEhlaWdodCh0cnVlKSA6IG5leHRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgbmV4dEhlaWdodCA9IG5leHRIZWlnaHQgPT09IHVuZGVmaW5lZCA/IC0xIDogbmV4dEhlaWdodDtcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBuZXh0SGVpZ2h0ID49IDAgPyBzY3JvbGxPZmZzZXQgKyBuZXh0SGVpZ2h0IDogc2l6ZVt0aGlzLl9kaXJlY3Rpb25dICsgMTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJldkhlaWdodCA9IHByZXZIZWlnaHQgPT09IHVuZGVmaW5lZCA/IHRoaXMuX2NhbGNTY3JvbGxIZWlnaHQoZmFsc2UpIDogcHJldkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgcHJldkhlaWdodCA9IHByZXZIZWlnaHQgPT09IHVuZGVmaW5lZCA/IC0xIDogcHJldkhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgdG90YWxIZWlnaHQgPSBwcmV2SGVpZ2h0ID49IDAgJiYgbmV4dEhlaWdodCA+PSAwID8gcHJldkhlaWdodCArIG5leHRIZWlnaHQgOiAtMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvdGFsSGVpZ2h0ID49IDAgJiYgdG90YWxIZWlnaHQgPCBzaXplW3RoaXMuX2RpcmVjdGlvbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IE1hdGgucm91bmQoc2Nyb2xsT2Zmc2V0IC0gcHJldkhlaWdodCArIHNpemVbdGhpcy5fZGlyZWN0aW9uXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gLShvZmZzZXQgLSBzaXplW3RoaXMuX2RpcmVjdGlvbl0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHZpc2libGVQZXJjID0gTWF0aC5tYXgoTWF0aC5taW4ob2Zmc2V0IC8gcHVsbExlbmd0aCwgMSksIDApO1xuICAgICAgICAgICAgc3dpdGNoIChwdWxsVG9SZWZyZXNoLnN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlIFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU46XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZUNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2aXNpYmxlUGVyYyA+PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfc2V0UHVsbFRvUmVmcmVzaFN0YXRlKHB1bGxUb1JlZnJlc2gsIFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9mZnNldCA+PSAwLjIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgUHVsbFRvUmVmcmVzaFN0YXRlLlBVTExJTkcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQdWxsVG9SZWZyZXNoU3RhdGUuUFVMTElORzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQgJiYgdmlzaWJsZVBlcmMgPj0gMSkge1xuICAgICAgICAgICAgICAgICAgICBfc2V0UHVsbFRvUmVmcmVzaFN0YXRlKHB1bGxUb1JlZnJlc2gsIFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob2Zmc2V0IDwgMC4yKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERFTik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQdWxsVG9SZWZyZXNoU3RhdGUuQUNUSVZFOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQdWxsVG9SZWZyZXNoU3RhdGUuQ09NUExFVEVEOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9mZnNldCA+PSAwLjIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERJTkcpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBQdWxsVG9SZWZyZXNoU3RhdGUuSElEREVOKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERJTkc6XG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCA8IDAuMikge1xuICAgICAgICAgICAgICAgICAgICBfc2V0UHVsbFRvUmVmcmVzaFN0YXRlKHB1bGxUb1JlZnJlc2gsIFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwdWxsVG9SZWZyZXNoLnN0YXRlICE9PSBQdWxsVG9SZWZyZXNoU3RhdGUuSElEREVOKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHROb2RlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyTm9kZTogcHVsbFRvUmVmcmVzaC5ub2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldjogIXB1bGxUb1JlZnJlc2guZm9vdGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dDogcHVsbFRvUmVmcmVzaC5mb290ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogIXB1bGxUb1JlZnJlc2guZm9vdGVyID8gLS10aGlzLl9ub2Rlcy5fY29udGV4dFN0YXRlLnByZXZHZXRJbmRleCA6ICsrdGhpcy5fbm9kZXMuX2NvbnRleHRTdGF0ZS5uZXh0R2V0SW5kZXhcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgICAgIGlmIChwdWxsVG9SZWZyZXNoLnN0YXRlID09PSBQdWxsVG9SZWZyZXNoU3RhdGUuQUNUSVZFKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbExlbmd0aCA9IGxlbmd0aDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZUNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbExlbmd0aCA9IE1hdGgubWluKG9mZnNldCwgbGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHNldCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemVbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLTAuMDAxXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoOiBzY3JvbGxMZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBzZXQuc2l6ZVt0aGlzLl9kaXJlY3Rpb25dID0gTWF0aC5tYXgoTWF0aC5taW4ob2Zmc2V0LCBwdWxsTGVuZ3RoKSwgMCk7XG4gICAgICAgICAgICAgICAgc2V0LnRyYW5zbGF0ZVt0aGlzLl9kaXJlY3Rpb25dID0gcHVsbFRvUmVmcmVzaC5mb290ZXIgPyBzaXplW3RoaXMuX2RpcmVjdGlvbl0gLSBsZW5ndGggOiAwO1xuICAgICAgICAgICAgICAgIHRoaXMuX25vZGVzLl9jb250ZXh0LnNldChjb250ZXh0Tm9kZSwgc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuc2hvd1B1bGxUb1JlZnJlc2ggPSBmdW5jdGlvbiAoZm9vdGVyKSB7XG4gICAgdmFyIHB1bGxUb1JlZnJlc2ggPSBfZ2V0UHVsbFRvUmVmcmVzaC5jYWxsKHRoaXMsIGZvb3Rlcik7XG4gICAgaWYgKHB1bGxUb1JlZnJlc2gpIHtcbiAgICAgICAgX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBQdWxsVG9SZWZyZXNoU3RhdGUuQUNUSVZFKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNjcm9sbERpcnR5ID0gdHJ1ZTtcbiAgICB9XG59O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLmhpZGVQdWxsVG9SZWZyZXNoID0gZnVuY3Rpb24gKGZvb3Rlcikge1xuICAgIHZhciBwdWxsVG9SZWZyZXNoID0gX2dldFB1bGxUb1JlZnJlc2guY2FsbCh0aGlzLCBmb290ZXIpO1xuICAgIGlmIChwdWxsVG9SZWZyZXNoICYmIHB1bGxUb1JlZnJlc2guc3RhdGUgPT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUpIHtcbiAgICAgICAgX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBQdWxsVG9SZWZyZXNoU3RhdGUuQ09NUExFVEVEKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNjcm9sbERpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLmlzUHVsbFRvUmVmcmVzaFZpc2libGUgPSBmdW5jdGlvbiAoZm9vdGVyKSB7XG4gICAgdmFyIHB1bGxUb1JlZnJlc2ggPSBfZ2V0UHVsbFRvUmVmcmVzaC5jYWxsKHRoaXMsIGZvb3Rlcik7XG4gICAgcmV0dXJuIHB1bGxUb1JlZnJlc2ggPyBwdWxsVG9SZWZyZXNoLnN0YXRlID09PSBQdWxsVG9SZWZyZXNoU3RhdGUuQUNUSVZFIDogZmFsc2U7XG59O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLmFwcGx5U2Nyb2xsRm9yY2UgPSBmdW5jdGlvbiAoZGVsdGEpIHtcbiAgICB2YXIgbGVhZGluZ1Njcm9sbFZpZXcgPSB0aGlzLm9wdGlvbnMubGVhZGluZ1Njcm9sbFZpZXc7XG4gICAgdmFyIHRyYWlsaW5nU2Nyb2xsVmlldyA9IHRoaXMub3B0aW9ucy50cmFpbGluZ1Njcm9sbFZpZXc7XG4gICAgaWYgKCFsZWFkaW5nU2Nyb2xsVmlldyAmJiAhdHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgIHJldHVybiBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5hcHBseVNjcm9sbEZvcmNlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgIH1cbiAgICB2YXIgcGFydGlhbERlbHRhO1xuICAgIGlmIChkZWx0YSA8IDApIHtcbiAgICAgICAgaWYgKGxlYWRpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSBsZWFkaW5nU2Nyb2xsVmlldy5jYW5TY3JvbGwoZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSArPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBsZWFkaW5nU2Nyb2xsVmlldy5hcHBseVNjcm9sbEZvcmNlKHBhcnRpYWxEZWx0YSk7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyYWlsaW5nU2Nyb2xsVmlldykge1xuICAgICAgICAgICAgcGFydGlhbERlbHRhID0gdGhpcy5jYW5TY3JvbGwoZGVsdGEpO1xuICAgICAgICAgICAgU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuYXBwbHlTY3JvbGxGb3JjZS5jYWxsKHRoaXMsIHBhcnRpYWxEZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhICs9IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIHRyYWlsaW5nU2Nyb2xsVmlldy5hcHBseVNjcm9sbEZvcmNlKGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhICs9IGRlbHRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuYXBwbHlTY3JvbGxGb3JjZS5jYWxsKHRoaXMsIGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSB0cmFpbGluZ1Njcm9sbFZpZXcuY2FuU2Nyb2xsKGRlbHRhKTtcbiAgICAgICAgICAgIHRyYWlsaW5nU2Nyb2xsVmlldy5hcHBseVNjcm9sbEZvcmNlKHBhcnRpYWxEZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSArPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxlYWRpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSB0aGlzLmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5hcHBseVNjcm9sbEZvcmNlLmNhbGwodGhpcywgcGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKz0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgbGVhZGluZ1Njcm9sbFZpZXcuYXBwbHlTY3JvbGxGb3JjZShkZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhICs9IGRlbHRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuYXBwbHlTY3JvbGxGb3JjZS5jYWxsKHRoaXMsIGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLnVwZGF0ZVNjcm9sbEZvcmNlID0gZnVuY3Rpb24gKHByZXZEZWx0YSwgbmV3RGVsdGEpIHtcbiAgICB2YXIgbGVhZGluZ1Njcm9sbFZpZXcgPSB0aGlzLm9wdGlvbnMubGVhZGluZ1Njcm9sbFZpZXc7XG4gICAgdmFyIHRyYWlsaW5nU2Nyb2xsVmlldyA9IHRoaXMub3B0aW9ucy50cmFpbGluZ1Njcm9sbFZpZXc7XG4gICAgaWYgKCFsZWFkaW5nU2Nyb2xsVmlldyAmJiAhdHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgIHJldHVybiBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVTY3JvbGxGb3JjZS5jYWxsKHRoaXMsIHByZXZEZWx0YSwgbmV3RGVsdGEpO1xuICAgIH1cbiAgICB2YXIgcGFydGlhbERlbHRhO1xuICAgIHZhciBkZWx0YSA9IG5ld0RlbHRhIC0gcHJldkRlbHRhO1xuICAgIGlmIChkZWx0YSA8IDApIHtcbiAgICAgICAgaWYgKGxlYWRpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSBsZWFkaW5nU2Nyb2xsVmlldy5jYW5TY3JvbGwoZGVsdGEpO1xuICAgICAgICAgICAgbGVhZGluZ1Njcm9sbFZpZXcudXBkYXRlU2Nyb2xsRm9yY2UodGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSwgdGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSArIHBhcnRpYWxEZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhICs9IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhaWxpbmdTY3JvbGxWaWV3ICYmIGRlbHRhKSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSB0aGlzLmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVTY3JvbGxGb3JjZS5jYWxsKHRoaXMsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKyBwYXJ0aWFsRGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgICAgIHRyYWlsaW5nU2Nyb2xsVmlldy51cGRhdGVTY3JvbGxGb3JjZSh0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSwgdGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEgKyBkZWx0YSk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGVsdGEpIHtcbiAgICAgICAgICAgIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArIGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSB0cmFpbGluZ1Njcm9sbFZpZXcuY2FuU2Nyb2xsKGRlbHRhKTtcbiAgICAgICAgICAgIHRyYWlsaW5nU2Nyb2xsVmlldy51cGRhdGVTY3JvbGxGb3JjZSh0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSwgdGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEgKyBwYXJ0aWFsRGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEgKz0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZWFkaW5nU2Nyb2xsVmlldykge1xuICAgICAgICAgICAgcGFydGlhbERlbHRhID0gdGhpcy5jYW5TY3JvbGwoZGVsdGEpO1xuICAgICAgICAgICAgU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUudXBkYXRlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhICsgcGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKz0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgbGVhZGluZ1Njcm9sbFZpZXcudXBkYXRlU2Nyb2xsRm9yY2UodGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSwgdGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSArIGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX2xlYWRpbmdTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVTY3JvbGxGb3JjZS5jYWxsKHRoaXMsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKyBkZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhICs9IGRlbHRhO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbkZsZXhTY3JvbGxWaWV3LnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UgPSBmdW5jdGlvbiAoZGVsdGEsIHZlbG9jaXR5KSB7XG4gICAgdmFyIGxlYWRpbmdTY3JvbGxWaWV3ID0gdGhpcy5vcHRpb25zLmxlYWRpbmdTY3JvbGxWaWV3O1xuICAgIHZhciB0cmFpbGluZ1Njcm9sbFZpZXcgPSB0aGlzLm9wdGlvbnMudHJhaWxpbmdTY3JvbGxWaWV3O1xuICAgIGlmICghbGVhZGluZ1Njcm9sbFZpZXcgJiYgIXRyYWlsaW5nU2Nyb2xsVmlldykge1xuICAgICAgICByZXR1cm4gU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUucmVsZWFzZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgZGVsdGEsIHZlbG9jaXR5KTtcbiAgICB9XG4gICAgdmFyIHBhcnRpYWxEZWx0YTtcbiAgICBpZiAoZGVsdGEgPCAwKSB7XG4gICAgICAgIGlmIChsZWFkaW5nU2Nyb2xsVmlldykge1xuICAgICAgICAgICAgcGFydGlhbERlbHRhID0gTWF0aC5tYXgodGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBsZWFkaW5nU2Nyb2xsVmlldy5yZWxlYXNlU2Nyb2xsRm9yY2UodGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEgPyAwIDogdmVsb2NpdHkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IE1hdGgubWF4KHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEsIGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUucmVsZWFzZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEgPyAwIDogdmVsb2NpdHkpO1xuICAgICAgICAgICAgdGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEgLT0gZGVsdGE7XG4gICAgICAgICAgICB0cmFpbGluZ1Njcm9sbFZpZXcucmVsZWFzZVNjcm9sbEZvcmNlKHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IHZlbG9jaXR5IDogMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhIC09IGRlbHRhO1xuICAgICAgICAgICAgU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUucmVsZWFzZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEgPyB2ZWxvY2l0eSA6IDApO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRyYWlsaW5nU2Nyb2xsVmlldykge1xuICAgICAgICAgICAgcGFydGlhbERlbHRhID0gTWF0aC5taW4odGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEsIGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIHRyYWlsaW5nU2Nyb2xsVmlldy5yZWxlYXNlU2Nyb2xsRm9yY2UodGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEsIGRlbHRhID8gMCA6IHZlbG9jaXR5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVhZGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IE1hdGgubWluKHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEsIGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUucmVsZWFzZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEgPyAwIDogdmVsb2NpdHkpO1xuICAgICAgICAgICAgdGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSAtPSBkZWx0YTtcbiAgICAgICAgICAgIGxlYWRpbmdTY3JvbGxWaWV3LnJlbGVhc2VTY3JvbGxGb3JjZSh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IHZlbG9jaXR5IDogMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhIC09IGRlbHRhO1xuICAgICAgICAgICAgU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUudXBkYXRlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IHZlbG9jaXR5IDogMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLmNvbW1pdCA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdCA9IFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmNvbW1pdC5jYWxsKHRoaXMsIGNvbnRleHQpO1xuICAgIGlmICh0aGlzLl9wdWxsVG9SZWZyZXNoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcHVsbFRvUmVmcmVzaCA9IHRoaXMuX3B1bGxUb1JlZnJlc2hbaV07XG4gICAgICAgICAgICBpZiAocHVsbFRvUmVmcmVzaCkge1xuICAgICAgICAgICAgICAgIGlmIChwdWxsVG9SZWZyZXNoLnN0YXRlID09PSBQdWxsVG9SZWZyZXNoU3RhdGUuQUNUSVZFICYmIHB1bGxUb1JlZnJlc2gucHJldlN0YXRlICE9PSBQdWxsVG9SZWZyZXNoU3RhdGUuQUNUSVZFKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ3JlZnJlc2gnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IHRoaXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBmb290ZXI6IHB1bGxUb1JlZnJlc2guZm9vdGVyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwdWxsVG9SZWZyZXNoLnByZXZTdGF0ZSA9IHB1bGxUb1JlZnJlc2guc3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IEZsZXhTY3JvbGxWaWV3OyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBPcHRpb25zTWFuYWdlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLk9wdGlvbnNNYW5hZ2VyIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuT3B0aW9uc01hbmFnZXIgOiBudWxsO1xudmFyIFRyYW5zZm9ybSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IG51bGw7XG52YXIgVmVjdG9yID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLm1hdGguVmVjdG9yIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLm1hdGguVmVjdG9yIDogbnVsbDtcbnZhciBQYXJ0aWNsZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5waHlzaWNzLmJvZGllcy5QYXJ0aWNsZSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5waHlzaWNzLmJvZGllcy5QYXJ0aWNsZSA6IG51bGw7XG52YXIgU3ByaW5nID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnBoeXNpY3MuZm9yY2VzLlNwcmluZyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5waHlzaWNzLmZvcmNlcy5TcHJpbmcgOiBudWxsO1xudmFyIFBoeXNpY3NFbmdpbmUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMucGh5c2ljcy5QaHlzaWNzRW5naW5lIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnBoeXNpY3MuUGh5c2ljc0VuZ2luZSA6IG51bGw7XG52YXIgTGF5b3V0Tm9kZSA9IHJlcXVpcmUoJy4vTGF5b3V0Tm9kZScpO1xudmFyIFRyYW5zaXRpb25hYmxlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnRyYW5zaXRpb25zLlRyYW5zaXRpb25hYmxlIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnRyYW5zaXRpb25zLlRyYW5zaXRpb25hYmxlIDogbnVsbDtcbmZ1bmN0aW9uIEZsb3dMYXlvdXROb2RlKHJlbmRlck5vZGUsIHNwZWMpIHtcbiAgICBMYXlvdXROb2RlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmNyZWF0ZSh0aGlzLmNvbnN0cnVjdG9yLkRFRkFVTFRfT1BUSU9OUyk7XG4gICAgICAgIHRoaXMuX29wdGlvbnNNYW5hZ2VyID0gbmV3IE9wdGlvbnNNYW5hZ2VyKHRoaXMub3B0aW9ucyk7XG4gICAgfVxuICAgIGlmICghdGhpcy5fcGUpIHtcbiAgICAgICAgdGhpcy5fcGUgPSBuZXcgUGh5c2ljc0VuZ2luZSgpO1xuICAgICAgICB0aGlzLl9wZS5zbGVlcCgpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX3Byb3BlcnRpZXMpIHtcbiAgICAgICAgdGhpcy5fcHJvcGVydGllcyA9IHt9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIHByb3BOYW1lIGluIHRoaXMuX3Byb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BlcnRpZXNbcHJvcE5hbWVdLmluaXQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXRoaXMuX2xvY2tUcmFuc2l0aW9uYWJsZSkge1xuICAgICAgICB0aGlzLl9sb2NrVHJhbnNpdGlvbmFibGUgPSBuZXcgVHJhbnNpdGlvbmFibGUoMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbG9ja1RyYW5zaXRpb25hYmxlLmhhbHQoKTtcbiAgICAgICAgdGhpcy5fbG9ja1RyYW5zaXRpb25hYmxlLnJlc2V0KDEpO1xuICAgIH1cbiAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSB0cnVlO1xuICAgIHRoaXMuX2luaXRpYWwgPSB0cnVlO1xuICAgIGlmIChzcGVjKSB7XG4gICAgICAgIHRoaXMuc2V0U3BlYyhzcGVjKTtcbiAgICB9XG59XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKExheW91dE5vZGUucHJvdG90eXBlKTtcbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZsb3dMYXlvdXROb2RlO1xuRmxvd0xheW91dE5vZGUuREVGQVVMVF9PUFRJT05TID0ge1xuICAgIHNwcmluZzoge1xuICAgICAgICBkYW1waW5nUmF0aW86IDAuOCxcbiAgICAgICAgcGVyaW9kOiAzMDBcbiAgICB9LFxuICAgIHBhcnRpY2xlUm91bmRpbmc6IDAuMDAxXG59O1xudmFyIERFRkFVTFQgPSB7XG4gICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgIG9wYWNpdHkyRDogW1xuICAgICAgICAgICAgMSxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBhbGlnbjogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgc2NhbGU6IFtcbiAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAxLFxuICAgICAgICAgICAgMVxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICByb3RhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBza2V3OiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXVxuICAgIH07XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdGhpcy5fb3B0aW9uc01hbmFnZXIuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICB2YXIgd2FzU2xlZXBpbmcgPSB0aGlzLl9wZS5pc1NsZWVwaW5nKCk7XG4gICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gdGhpcy5fcHJvcGVydGllcykge1xuICAgICAgICB2YXIgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXNbcHJvcE5hbWVdO1xuICAgICAgICBpZiAocHJvcC5mb3JjZSkge1xuICAgICAgICAgICAgcHJvcC5mb3JjZS5zZXRPcHRpb25zKHByb3AuZm9yY2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh3YXNTbGVlcGluZykge1xuICAgICAgICB0aGlzLl9wZS5zbGVlcCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUuc2V0U3BlYyA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gICAgdmFyIHNldDtcbiAgICBpZiAoc3BlYy50cmFuc2Zvcm0pIHtcbiAgICAgICAgc2V0ID0gVHJhbnNmb3JtLmludGVycHJldChzcGVjLnRyYW5zZm9ybSk7XG4gICAgfVxuICAgIGlmICghc2V0KSB7XG4gICAgICAgIHNldCA9IHt9O1xuICAgIH1cbiAgICBzZXQub3BhY2l0eSA9IHNwZWMub3BhY2l0eTtcbiAgICBzZXQuc2l6ZSA9IHNwZWMuc2l6ZTtcbiAgICBzZXQuYWxpZ24gPSBzcGVjLmFsaWduO1xuICAgIHNldC5vcmlnaW4gPSBzcGVjLm9yaWdpbjtcbiAgICB2YXIgb2xkUmVtb3ZpbmcgPSB0aGlzLl9yZW1vdmluZztcbiAgICB2YXIgb2xkSW52YWxpZGF0ZWQgPSB0aGlzLl9pbnZhbGlkYXRlZDtcbiAgICB0aGlzLnNldChzZXQpO1xuICAgIHRoaXMuX3JlbW92aW5nID0gb2xkUmVtb3Zpbmc7XG4gICAgdGhpcy5faW52YWxpZGF0ZWQgPSBvbGRJbnZhbGlkYXRlZDtcbn07XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2ludmFsaWRhdGVkKSB7XG4gICAgICAgIGZvciAodmFyIHByb3BOYW1lIGluIHRoaXMuX3Byb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BlcnRpZXNbcHJvcE5hbWVdLmludmFsaWRhdGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faW52YWxpZGF0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy50cnVlU2l6ZVJlcXVlc3RlZCA9IGZhbHNlO1xuICAgIHRoaXMudXNlc1RydWVTaXplID0gZmFsc2U7XG59O1xuRmxvd0xheW91dE5vZGUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChyZW1vdmVTcGVjKSB7XG4gICAgdGhpcy5fcmVtb3ZpbmcgPSB0cnVlO1xuICAgIGlmIChyZW1vdmVTcGVjKSB7XG4gICAgICAgIHRoaXMuc2V0U3BlYyhyZW1vdmVTcGVjKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wZS5zbGVlcCgpO1xuICAgICAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5faW52YWxpZGF0ZWQgPSBmYWxzZTtcbn07XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUucmVsZWFzZUxvY2sgPSBmdW5jdGlvbiAoZHVyYXRpb24pIHtcbiAgICB0aGlzLl9sb2NrVHJhbnNpdGlvbmFibGUuaGFsdCgpO1xuICAgIHRoaXMuX2xvY2tUcmFuc2l0aW9uYWJsZS5yZXNldCgwKTtcbiAgICB0aGlzLl9sb2NrVHJhbnNpdGlvbmFibGUuc2V0KDEsIHsgZHVyYXRpb246IGR1cmF0aW9uIHx8IHRoaXMub3B0aW9ucy5zcHJpbmcucGVyaW9kIHx8IDEwMDAgfSk7XG59O1xuZnVuY3Rpb24gX2dldFJvdW5kZWRWYWx1ZTNEKHByb3AsIGRlZiwgcHJlY2lzaW9uKSB7XG4gICAgaWYgKCFwcm9wIHx8ICFwcm9wLmluaXQpIHtcbiAgICAgICAgcmV0dXJuIGRlZjtcbiAgICB9XG4gICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uIHx8IHRoaXMub3B0aW9ucy5wYXJ0aWNsZVJvdW5kaW5nO1xuICAgIHZhciB2YWx1ZSA9IHByb3AucGFydGljbGUuZ2V0UG9zaXRpb24oKTtcbiAgICByZXR1cm4gW1xuICAgICAgICBNYXRoLnJvdW5kKHZhbHVlWzBdIC8gcHJlY2lzaW9uKSAqIHByZWNpc2lvbixcbiAgICAgICAgTWF0aC5yb3VuZCh2YWx1ZVsxXSAvIHByZWNpc2lvbikgKiBwcmVjaXNpb24sXG4gICAgICAgIE1hdGgucm91bmQodmFsdWVbMl0gLyBwcmVjaXNpb24pICogcHJlY2lzaW9uXG4gICAgXTtcbn1cbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZS5nZXRTcGVjID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBlbmRTdGF0ZVJlYWNoZWQgPSB0aGlzLl9wZS5pc1NsZWVwaW5nKCk7XG4gICAgaWYgKCF0aGlzLl9zcGVjTW9kaWZpZWQgJiYgZW5kU3RhdGVSZWFjaGVkKSB7XG4gICAgICAgIHRoaXMuX3NwZWMucmVtb3ZlZCA9ICF0aGlzLl9pbnZhbGlkYXRlZDtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NwZWM7XG4gICAgfVxuICAgIHRoaXMuX2luaXRpYWwgPSBmYWxzZTtcbiAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSAhZW5kU3RhdGVSZWFjaGVkO1xuICAgIHRoaXMuX3NwZWMucmVtb3ZlZCA9IGZhbHNlO1xuICAgIGlmICghZW5kU3RhdGVSZWFjaGVkKSB7XG4gICAgICAgIHRoaXMuX3BlLnN0ZXAoKTtcbiAgICB9XG4gICAgdmFyIHNwZWMgPSB0aGlzLl9zcGVjO1xuICAgIHZhciBwcmVjaXNpb24gPSB0aGlzLm9wdGlvbnMucGFydGljbGVSb3VuZGluZztcbiAgICB2YXIgbG9ja1ZhbHVlID0gdGhpcy5fbG9ja1RyYW5zaXRpb25hYmxlLmdldCgpO1xuICAgIHZhciBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5vcGFjaXR5O1xuICAgIGlmIChwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBzcGVjLm9wYWNpdHkgPSBNYXRoLnJvdW5kKE1hdGgubWF4KDAsIE1hdGgubWluKDEsIHByb3AuY3VyU3RhdGUueCkpIC8gcHJlY2lzaW9uKSAqIHByZWNpc2lvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzcGVjLm9wYWNpdHkgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLnNpemU7XG4gICAgaWYgKHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIHNwZWMuc2l6ZSA9IHNwZWMuc2l6ZSB8fCBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdO1xuICAgICAgICBzcGVjLnNpemVbMF0gPSBNYXRoLnJvdW5kKChwcm9wLmN1clN0YXRlLnggKyAocHJvcC5lbmRTdGF0ZS54IC0gcHJvcC5jdXJTdGF0ZS54KSAqIGxvY2tWYWx1ZSkgLyAwLjEpICogMC4xO1xuICAgICAgICBzcGVjLnNpemVbMV0gPSBNYXRoLnJvdW5kKChwcm9wLmN1clN0YXRlLnkgKyAocHJvcC5lbmRTdGF0ZS55IC0gcHJvcC5jdXJTdGF0ZS55KSAqIGxvY2tWYWx1ZSkgLyAwLjEpICogMC4xO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMuc2l6ZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMuYWxpZ247XG4gICAgaWYgKHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIHNwZWMuYWxpZ24gPSBzcGVjLmFsaWduIHx8IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF07XG4gICAgICAgIHNwZWMuYWxpZ25bMF0gPSBNYXRoLnJvdW5kKChwcm9wLmN1clN0YXRlLnggKyAocHJvcC5lbmRTdGF0ZS54IC0gcHJvcC5jdXJTdGF0ZS54KSAqIGxvY2tWYWx1ZSkgLyAwLjEpICogMC4xO1xuICAgICAgICBzcGVjLmFsaWduWzFdID0gTWF0aC5yb3VuZCgocHJvcC5jdXJTdGF0ZS55ICsgKHByb3AuZW5kU3RhdGUueSAtIHByb3AuY3VyU3RhdGUueSkgKiBsb2NrVmFsdWUpIC8gMC4xKSAqIDAuMTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzcGVjLmFsaWduID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5vcmlnaW47XG4gICAgaWYgKHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIHNwZWMub3JpZ2luID0gc3BlYy5vcmlnaW4gfHwgW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICAgICAgc3BlYy5vcmlnaW5bMF0gPSBNYXRoLnJvdW5kKChwcm9wLmN1clN0YXRlLnggKyAocHJvcC5lbmRTdGF0ZS54IC0gcHJvcC5jdXJTdGF0ZS54KSAqIGxvY2tWYWx1ZSkgLyAwLjEpICogMC4xO1xuICAgICAgICBzcGVjLm9yaWdpblsxXSA9IE1hdGgucm91bmQoKHByb3AuY3VyU3RhdGUueSArIChwcm9wLmVuZFN0YXRlLnkgLSBwcm9wLmN1clN0YXRlLnkpICogbG9ja1ZhbHVlKSAvIDAuMSkgKiAwLjE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3BlYy5vcmlnaW4gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHZhciB0cmFuc2xhdGUgPSB0aGlzLl9wcm9wZXJ0aWVzLnRyYW5zbGF0ZTtcbiAgICB2YXIgdHJhbnNsYXRlWDtcbiAgICB2YXIgdHJhbnNsYXRlWTtcbiAgICB2YXIgdHJhbnNsYXRlWjtcbiAgICBpZiAodHJhbnNsYXRlICYmIHRyYW5zbGF0ZS5pbml0KSB7XG4gICAgICAgIHRyYW5zbGF0ZVggPSBNYXRoLnJvdW5kKCh0cmFuc2xhdGUuY3VyU3RhdGUueCArICh0cmFuc2xhdGUuZW5kU3RhdGUueCAtIHRyYW5zbGF0ZS5jdXJTdGF0ZS54KSAqIGxvY2tWYWx1ZSkgLyBwcmVjaXNpb24pICogcHJlY2lzaW9uO1xuICAgICAgICB0cmFuc2xhdGVZID0gTWF0aC5yb3VuZCgodHJhbnNsYXRlLmN1clN0YXRlLnkgKyAodHJhbnNsYXRlLmVuZFN0YXRlLnkgLSB0cmFuc2xhdGUuY3VyU3RhdGUueSkgKiBsb2NrVmFsdWUpIC8gcHJlY2lzaW9uKSAqIHByZWNpc2lvbjtcbiAgICAgICAgdHJhbnNsYXRlWiA9IE1hdGgucm91bmQoKHRyYW5zbGF0ZS5jdXJTdGF0ZS56ICsgKHRyYW5zbGF0ZS5lbmRTdGF0ZS56IC0gdHJhbnNsYXRlLmN1clN0YXRlLnopICogbG9ja1ZhbHVlKSAvIHByZWNpc2lvbikgKiBwcmVjaXNpb247XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJhbnNsYXRlWCA9IDA7XG4gICAgICAgIHRyYW5zbGF0ZVkgPSAwO1xuICAgICAgICB0cmFuc2xhdGVaID0gMDtcbiAgICB9XG4gICAgdmFyIHNjYWxlID0gdGhpcy5fcHJvcGVydGllcy5zY2FsZTtcbiAgICB2YXIgc2tldyA9IHRoaXMuX3Byb3BlcnRpZXMuc2tldztcbiAgICB2YXIgcm90YXRlID0gdGhpcy5fcHJvcGVydGllcy5yb3RhdGU7XG4gICAgaWYgKHNjYWxlIHx8IHNrZXcgfHwgcm90YXRlKSB7XG4gICAgICAgIHNwZWMudHJhbnNmb3JtID0gVHJhbnNmb3JtLmJ1aWxkKHtcbiAgICAgICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgICAgIHRyYW5zbGF0ZVgsXG4gICAgICAgICAgICAgICAgdHJhbnNsYXRlWSxcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGVaXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgc2tldzogX2dldFJvdW5kZWRWYWx1ZTNELmNhbGwodGhpcywgc2tldywgREVGQVVMVC5za2V3KSxcbiAgICAgICAgICAgIHNjYWxlOiBfZ2V0Um91bmRlZFZhbHVlM0QuY2FsbCh0aGlzLCBzY2FsZSwgREVGQVVMVC5zY2FsZSksXG4gICAgICAgICAgICByb3RhdGU6IF9nZXRSb3VuZGVkVmFsdWUzRC5jYWxsKHRoaXMsIHJvdGF0ZSwgREVGQVVMVC5yb3RhdGUpXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHJhbnNsYXRlKSB7XG4gICAgICAgIGlmICghc3BlYy50cmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIHNwZWMudHJhbnNmb3JtID0gVHJhbnNmb3JtLnRyYW5zbGF0ZSh0cmFuc2xhdGVYLCB0cmFuc2xhdGVZLCB0cmFuc2xhdGVaKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNwZWMudHJhbnNmb3JtWzEyXSA9IHRyYW5zbGF0ZVg7XG4gICAgICAgICAgICBzcGVjLnRyYW5zZm9ybVsxM10gPSB0cmFuc2xhdGVZO1xuICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTRdID0gdHJhbnNsYXRlWjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMudHJhbnNmb3JtID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fc3BlYztcbn07XG5mdW5jdGlvbiBfc2V0UHJvcGVydHlWYWx1ZShwcm9wLCBwcm9wTmFtZSwgZW5kU3RhdGUsIGRlZmF1bHRWYWx1ZSwgaW1tZWRpYXRlLCBpc1RyYW5zbGF0ZSkge1xuICAgIHByb3AgPSBwcm9wIHx8IHRoaXMuX3Byb3BlcnRpZXNbcHJvcE5hbWVdO1xuICAgIGlmIChwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBwcm9wLmludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIHZhbHVlID0gZGVmYXVsdFZhbHVlO1xuICAgICAgICBpZiAoZW5kU3RhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFsdWUgPSBlbmRTdGF0ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9yZW1vdmluZykge1xuICAgICAgICAgICAgdmFsdWUgPSBwcm9wLnBhcnRpY2xlLmdldFBvc2l0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgcHJvcC5lbmRTdGF0ZS54ID0gdmFsdWVbMF07XG4gICAgICAgIHByb3AuZW5kU3RhdGUueSA9IHZhbHVlLmxlbmd0aCA+IDEgPyB2YWx1ZVsxXSA6IDA7XG4gICAgICAgIHByb3AuZW5kU3RhdGUueiA9IHZhbHVlLmxlbmd0aCA+IDIgPyB2YWx1ZVsyXSA6IDA7XG4gICAgICAgIGlmIChpbW1lZGlhdGUpIHtcbiAgICAgICAgICAgIHByb3AuY3VyU3RhdGUueCA9IHByb3AuZW5kU3RhdGUueDtcbiAgICAgICAgICAgIHByb3AuY3VyU3RhdGUueSA9IHByb3AuZW5kU3RhdGUueTtcbiAgICAgICAgICAgIHByb3AuY3VyU3RhdGUueiA9IHByb3AuZW5kU3RhdGUuejtcbiAgICAgICAgICAgIHByb3AudmVsb2NpdHkueCA9IDA7XG4gICAgICAgICAgICBwcm9wLnZlbG9jaXR5LnkgPSAwO1xuICAgICAgICAgICAgcHJvcC52ZWxvY2l0eS56ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9wLmVuZFN0YXRlLnggIT09IHByb3AuY3VyU3RhdGUueCB8fCBwcm9wLmVuZFN0YXRlLnkgIT09IHByb3AuY3VyU3RhdGUueSB8fCBwcm9wLmVuZFN0YXRlLnogIT09IHByb3AuY3VyU3RhdGUueikge1xuICAgICAgICAgICAgdGhpcy5fcGUud2FrZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgd2FzU2xlZXBpbmcgPSB0aGlzLl9wZS5pc1NsZWVwaW5nKCk7XG4gICAgICAgIGlmICghcHJvcCkge1xuICAgICAgICAgICAgcHJvcCA9IHtcbiAgICAgICAgICAgICAgICBwYXJ0aWNsZTogbmV3IFBhcnRpY2xlKHsgcG9zaXRpb246IHRoaXMuX2luaXRpYWwgfHwgaW1tZWRpYXRlID8gZW5kU3RhdGUgOiBkZWZhdWx0VmFsdWUgfSksXG4gICAgICAgICAgICAgICAgZW5kU3RhdGU6IG5ldyBWZWN0b3IoZW5kU3RhdGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcHJvcC5jdXJTdGF0ZSA9IHByb3AucGFydGljbGUucG9zaXRpb247XG4gICAgICAgICAgICBwcm9wLnZlbG9jaXR5ID0gcHJvcC5wYXJ0aWNsZS52ZWxvY2l0eTtcbiAgICAgICAgICAgIHByb3AuZm9yY2UgPSBuZXcgU3ByaW5nKHRoaXMub3B0aW9ucy5zcHJpbmcpO1xuICAgICAgICAgICAgcHJvcC5mb3JjZS5zZXRPcHRpb25zKHsgYW5jaG9yOiBwcm9wLmVuZFN0YXRlIH0pO1xuICAgICAgICAgICAgdGhpcy5fcGUuYWRkQm9keShwcm9wLnBhcnRpY2xlKTtcbiAgICAgICAgICAgIHByb3AuZm9yY2VJZCA9IHRoaXMuX3BlLmF0dGFjaChwcm9wLmZvcmNlLCBwcm9wLnBhcnRpY2xlKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BlcnRpZXNbcHJvcE5hbWVdID0gcHJvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb3AucGFydGljbGUuc2V0UG9zaXRpb24odGhpcy5faW5pdGlhbCB8fCBpbW1lZGlhdGUgPyBlbmRTdGF0ZSA6IGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgICAgICBwcm9wLmVuZFN0YXRlLnNldChlbmRTdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9pbml0aWFsICYmICFpbW1lZGlhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3BlLndha2UoKTtcbiAgICAgICAgfSBlbHNlIGlmICh3YXNTbGVlcGluZykge1xuICAgICAgICAgICAgdGhpcy5fcGUuc2xlZXAoKTtcbiAgICAgICAgfVxuICAgICAgICBwcm9wLmluaXQgPSB0cnVlO1xuICAgICAgICBwcm9wLmludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBfZ2V0SWZORTJEKGExLCBhMikge1xuICAgIHJldHVybiBhMVswXSA9PT0gYTJbMF0gJiYgYTFbMV0gPT09IGEyWzFdID8gdW5kZWZpbmVkIDogYTE7XG59XG5mdW5jdGlvbiBfZ2V0SWZORTNEKGExLCBhMikge1xuICAgIHJldHVybiBhMVswXSA9PT0gYTJbMF0gJiYgYTFbMV0gPT09IGEyWzFdICYmIGExWzJdID09PSBhMlsyXSA/IHVuZGVmaW5lZCA6IGExO1xufVxuRmxvd0xheW91dE5vZGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChzZXQsIGRlZmF1bHRTaXplKSB7XG4gICAgaWYgKGRlZmF1bHRTaXplKSB7XG4gICAgICAgIHRoaXMuX3JlbW92aW5nID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuX2ludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICB0aGlzLnNjcm9sbExlbmd0aCA9IHNldC5zY3JvbGxMZW5ndGg7XG4gICAgdGhpcy5fc3BlY01vZGlmaWVkID0gdHJ1ZTtcbiAgICB2YXIgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMub3BhY2l0eTtcbiAgICB2YXIgdmFsdWUgPSBzZXQub3BhY2l0eSA9PT0gREVGQVVMVC5vcGFjaXR5ID8gdW5kZWZpbmVkIDogc2V0Lm9wYWNpdHk7XG4gICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAnb3BhY2l0eScsIHZhbHVlID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBbXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSwgREVGQVVMVC5vcGFjaXR5MkQpO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5hbGlnbjtcbiAgICB2YWx1ZSA9IHNldC5hbGlnbiA/IF9nZXRJZk5FMkQoc2V0LmFsaWduLCBERUZBVUxULmFsaWduKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodmFsdWUgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAnYWxpZ24nLCB2YWx1ZSwgREVGQVVMVC5hbGlnbik7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLm9yaWdpbjtcbiAgICB2YWx1ZSA9IHNldC5vcmlnaW4gPyBfZ2V0SWZORTJEKHNldC5vcmlnaW4sIERFRkFVTFQub3JpZ2luKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodmFsdWUgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAnb3JpZ2luJywgdmFsdWUsIERFRkFVTFQub3JpZ2luKTtcbiAgICB9XG4gICAgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMuc2l6ZTtcbiAgICB2YWx1ZSA9IHNldC5zaXplIHx8IGRlZmF1bHRTaXplO1xuICAgIGlmICh2YWx1ZSB8fCBwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBfc2V0UHJvcGVydHlWYWx1ZS5jYWxsKHRoaXMsIHByb3AsICdzaXplJywgdmFsdWUsIGRlZmF1bHRTaXplLCB0aGlzLnVzZXNUcnVlU2l6ZSk7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLnRyYW5zbGF0ZTtcbiAgICB2YWx1ZSA9IHNldC50cmFuc2xhdGU7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3RyYW5zbGF0ZScsIHZhbHVlLCBERUZBVUxULnRyYW5zbGF0ZSwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICB9XG4gICAgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMuc2NhbGU7XG4gICAgdmFsdWUgPSBzZXQuc2NhbGUgPyBfZ2V0SWZORTNEKHNldC5zY2FsZSwgREVGQVVMVC5zY2FsZSkgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3NjYWxlJywgdmFsdWUsIERFRkFVTFQuc2NhbGUpO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5yb3RhdGU7XG4gICAgdmFsdWUgPSBzZXQucm90YXRlID8gX2dldElmTkUzRChzZXQucm90YXRlLCBERUZBVUxULnJvdGF0ZSkgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3JvdGF0ZScsIHZhbHVlLCBERUZBVUxULnJvdGF0ZSk7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLnNrZXc7XG4gICAgdmFsdWUgPSBzZXQuc2tldyA/IF9nZXRJZk5FM0Qoc2V0LnNrZXcsIERFRkFVTFQuc2tldykgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3NrZXcnLCB2YWx1ZSwgREVGQVVMVC5za2V3KTtcbiAgICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBGbG93TGF5b3V0Tm9kZTtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsImZ1bmN0aW9uIExheW91dENvbnRleHQobWV0aG9kcykge1xuICAgIGZvciAodmFyIG4gaW4gbWV0aG9kcykge1xuICAgICAgICB0aGlzW25dID0gbWV0aG9kc1tuXTtcbiAgICB9XG59XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5zaXplID0gdW5kZWZpbmVkO1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuZGlyZWN0aW9uID0gdW5kZWZpbmVkO1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuc2Nyb2xsT2Zmc2V0ID0gdW5kZWZpbmVkO1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuc2Nyb2xsU3RhcnQgPSB1bmRlZmluZWQ7XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5zY3JvbGxFbmQgPSB1bmRlZmluZWQ7XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xufTtcbkxheW91dENvbnRleHQucHJvdG90eXBlLnByZXYgPSBmdW5jdGlvbiAoKSB7XG59O1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKG5vZGUpIHtcbn07XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAobm9kZSwgc2V0KSB7XG59O1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUucmVzb2x2ZVNpemUgPSBmdW5jdGlvbiAobm9kZSkge1xufTtcbm1vZHVsZS5leHBvcnRzID0gTGF5b3V0Q29udGV4dDsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgVXRpbGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IG51bGw7XG52YXIgRW50aXR5ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuRW50aXR5IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuRW50aXR5IDogbnVsbDtcbnZhciBWaWV3U2VxdWVuY2UgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuY29yZS5WaWV3U2VxdWVuY2UgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5WaWV3U2VxdWVuY2UgOiBudWxsO1xudmFyIE9wdGlvbnNNYW5hZ2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuT3B0aW9uc01hbmFnZXIgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5PcHRpb25zTWFuYWdlciA6IG51bGw7XG52YXIgRXZlbnRIYW5kbGVyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuRXZlbnRIYW5kbGVyIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuRXZlbnRIYW5kbGVyIDogbnVsbDtcbnZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgTGF5b3V0Tm9kZU1hbmFnZXIgPSByZXF1aXJlKCcuL0xheW91dE5vZGVNYW5hZ2VyJyk7XG52YXIgTGF5b3V0Tm9kZSA9IHJlcXVpcmUoJy4vTGF5b3V0Tm9kZScpO1xudmFyIEZsb3dMYXlvdXROb2RlID0gcmVxdWlyZSgnLi9GbG93TGF5b3V0Tm9kZScpO1xudmFyIFRyYW5zZm9ybSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IG51bGw7XG5yZXF1aXJlKCcuL2hlbHBlcnMvTGF5b3V0RG9ja0hlbHBlcicpO1xuZnVuY3Rpb24gTGF5b3V0Q29udHJvbGxlcihvcHRpb25zLCBub2RlTWFuYWdlcikge1xuICAgIHRoaXMuaWQgPSBFbnRpdHkucmVnaXN0ZXIodGhpcyk7XG4gICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fY29udGV4dFNpemVDYWNoZSA9IFtcbiAgICAgICAgMCxcbiAgICAgICAgMFxuICAgIF07XG4gICAgdGhpcy5fY29tbWl0T3V0cHV0ID0ge307XG4gICAgdGhpcy5fZXZlbnRJbnB1dCA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbiAgICBFdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKHRoaXMsIHRoaXMuX2V2ZW50SW5wdXQpO1xuICAgIHRoaXMuX2V2ZW50T3V0cHV0ID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuICAgIEV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKHRoaXMsIHRoaXMuX2V2ZW50T3V0cHV0KTtcbiAgICB0aGlzLl9sYXlvdXQgPSB7IG9wdGlvbnM6IE9iamVjdC5jcmVhdGUoe30pIH07XG4gICAgdGhpcy5fbGF5b3V0Lm9wdGlvbnNNYW5hZ2VyID0gbmV3IE9wdGlvbnNNYW5hZ2VyKHRoaXMuX2xheW91dC5vcHRpb25zKTtcbiAgICB0aGlzLl9sYXlvdXQub3B0aW9uc01hbmFnZXIub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuY3JlYXRlKExheW91dENvbnRyb2xsZXIuREVGQVVMVF9PUFRJT05TKTtcbiAgICB0aGlzLl9vcHRpb25zTWFuYWdlciA9IG5ldyBPcHRpb25zTWFuYWdlcih0aGlzLm9wdGlvbnMpO1xuICAgIGlmIChub2RlTWFuYWdlcikge1xuICAgICAgICB0aGlzLl9ub2RlcyA9IG5vZGVNYW5hZ2VyO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmZsb3cpIHtcbiAgICAgICAgdGhpcy5fbm9kZXMgPSBuZXcgTGF5b3V0Tm9kZU1hbmFnZXIoRmxvd0xheW91dE5vZGUsIF9pbml0Rmxvd0xheW91dE5vZGUuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbm9kZXMgPSBuZXcgTGF5b3V0Tm9kZU1hbmFnZXIoTGF5b3V0Tm9kZSk7XG4gICAgfVxuICAgIHRoaXMuc2V0RGlyZWN0aW9uKHVuZGVmaW5lZCk7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgIH1cbn1cbkxheW91dENvbnRyb2xsZXIuREVGQVVMVF9PUFRJT05TID0ge1xuICAgIG5vZGVTcHJpbmc6IHtcbiAgICAgICAgZGFtcGluZ1JhdGlvOiAwLjgsXG4gICAgICAgIHBlcmlvZDogMzAwXG4gICAgfSxcbiAgICByZWZsb3dPblJlc2l6ZTogdHJ1ZVxufTtcbmZ1bmN0aW9uIF9pbml0Rmxvd0xheW91dE5vZGUobm9kZSwgc3BlYykge1xuICAgIGlmICghc3BlYyAmJiB0aGlzLm9wdGlvbnMuaW5zZXJ0U3BlYykge1xuICAgICAgICBub2RlLnNldFNwZWModGhpcy5vcHRpb25zLmluc2VydFNwZWMpO1xuICAgIH1cbn1cbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiBzZXRPcHRpb25zKG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5hbGlnbm1lbnQgIT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLmFsaWdubWVudCAhPT0gdGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5fb3B0aW9uc01hbmFnZXIuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICBpZiAob3B0aW9ucy5kYXRhU291cmNlKSB7XG4gICAgICAgIHRoaXMuc2V0RGF0YVNvdXJjZShvcHRpb25zLmRhdGFTb3VyY2UpO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5sYXlvdXQgfHwgb3B0aW9ucy5sYXlvdXRPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuc2V0TGF5b3V0KG9wdGlvbnMubGF5b3V0LCBvcHRpb25zLmxheW91dE9wdGlvbnMpO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5kaXJlY3Rpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLnNldERpcmVjdGlvbihvcHRpb25zLmRpcmVjdGlvbik7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLm5vZGVTcHJpbmcgJiYgdGhpcy5vcHRpb25zLmZsb3cpIHtcbiAgICAgICAgdGhpcy5fbm9kZXMuc2V0Tm9kZU9wdGlvbnMoeyBzcHJpbmc6IG9wdGlvbnMubm9kZVNwcmluZyB9KTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMucHJlYWxsb2NhdGVOb2Rlcykge1xuICAgICAgICB0aGlzLl9ub2Rlcy5wcmVhbGxvY2F0ZU5vZGVzKG9wdGlvbnMucHJlYWxsb2NhdGVOb2Rlcy5jb3VudCB8fCAwLCBvcHRpb25zLnByZWFsbG9jYXRlTm9kZXMuc3BlYyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbmZ1bmN0aW9uIF9mb3JFYWNoUmVuZGVyYWJsZShjYWxsYmFjaykge1xuICAgIHZhciBkYXRhU291cmNlID0gdGhpcy5fZGF0YVNvdXJjZTtcbiAgICBpZiAoZGF0YVNvdXJjZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gZGF0YVNvdXJjZS5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGFTb3VyY2VbaV0pO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChkYXRhU291cmNlIGluc3RhbmNlb2YgVmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHZhciByZW5kZXJhYmxlO1xuICAgICAgICB3aGlsZSAoZGF0YVNvdXJjZSkge1xuICAgICAgICAgICAgcmVuZGVyYWJsZSA9IGRhdGFTb3VyY2UuZ2V0KCk7XG4gICAgICAgICAgICBpZiAoIXJlbmRlcmFibGUpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrKHJlbmRlcmFibGUpO1xuICAgICAgICAgICAgZGF0YVNvdXJjZSA9IGRhdGFTb3VyY2UuZ2V0TmV4dCgpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGFTb3VyY2UpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGFTb3VyY2Vba2V5XSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5zZXREYXRhU291cmNlID0gZnVuY3Rpb24gKGRhdGFTb3VyY2UpIHtcbiAgICB0aGlzLl9kYXRhU291cmNlID0gZGF0YVNvdXJjZTtcbiAgICB0aGlzLl9ub2Rlc0J5SWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGRhdGFTb3VyY2UgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSBuZXcgVmlld1NlcXVlbmNlKGRhdGFTb3VyY2UpO1xuICAgIH0gZWxzZSBpZiAoZGF0YVNvdXJjZSBpbnN0YW5jZW9mIFZpZXdTZXF1ZW5jZSkge1xuICAgICAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSBkYXRhU291cmNlO1xuICAgIH0gZWxzZSBpZiAoZGF0YVNvdXJjZSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICB0aGlzLl9ub2Rlc0J5SWQgPSBkYXRhU291cmNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9QaXBlRXZlbnRzKSB7XG4gICAgICAgIF9mb3JFYWNoUmVuZGVyYWJsZS5jYWxsKHRoaXMsIGZ1bmN0aW9uIChyZW5kZXJhYmxlKSB7XG4gICAgICAgICAgICBpZiAocmVuZGVyYWJsZSAmJiByZW5kZXJhYmxlLnBpcGUpIHtcbiAgICAgICAgICAgICAgICByZW5kZXJhYmxlLnBpcGUodGhpcyk7XG4gICAgICAgICAgICAgICAgcmVuZGVyYWJsZS5waXBlKHRoaXMuX2V2ZW50T3V0cHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG4gICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuZ2V0RGF0YVNvdXJjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGF0YVNvdXJjZTtcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5zZXRMYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0LCBvcHRpb25zKSB7XG4gICAgaWYgKGxheW91dCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2xheW91dC5fZnVuY3Rpb24gPSBsYXlvdXQ7XG4gICAgICAgIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMgPSBsYXlvdXQuQ2FwYWJpbGl0aWVzO1xuICAgICAgICB0aGlzLl9sYXlvdXQubGl0ZXJhbCA9IHVuZGVmaW5lZDtcbiAgICB9IGVsc2UgaWYgKGxheW91dCBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICB0aGlzLl9sYXlvdXQubGl0ZXJhbCA9IGxheW91dDtcbiAgICAgICAgdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgdmFyIGhlbHBlck5hbWUgPSBPYmplY3Qua2V5cyhsYXlvdXQpWzBdO1xuICAgICAgICB2YXIgSGVscGVyID0gTGF5b3V0VXRpbGl0eS5nZXRSZWdpc3RlcmVkSGVscGVyKGhlbHBlck5hbWUpO1xuICAgICAgICB0aGlzLl9sYXlvdXQuX2Z1bmN0aW9uID0gSGVscGVyID8gZnVuY3Rpb24gKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBoZWxwZXIgPSBuZXcgSGVscGVyKGNvbnRleHQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaGVscGVyLnBhcnNlKGxheW91dFtoZWxwZXJOYW1lXSk7XG4gICAgICAgIH0gOiB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbGF5b3V0Ll9mdW5jdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fbGF5b3V0LmxpdGVyYWwgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuc2V0TGF5b3V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICB9XG4gICAgdGhpcy5zZXREaXJlY3Rpb24odGhpcy5fY29uZmlndXJlZERpcmVjdGlvbik7XG4gICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuZ2V0TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9sYXlvdXQubGl0ZXJhbCB8fCB0aGlzLl9sYXlvdXQuX2Z1bmN0aW9uO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnNldExheW91dE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHRoaXMuX2xheW91dC5vcHRpb25zTWFuYWdlci5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmdldExheW91dE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2xheW91dC5vcHRpb25zO1xufTtcbmZ1bmN0aW9uIF9nZXRBY3R1YWxEaXJlY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgaWYgKHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMgJiYgdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcy5kaXJlY3Rpb24pIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcy5kaXJlY3Rpb24pKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuZGlyZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuZGlyZWN0aW9uW2ldID09PSBkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRpcmVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcy5kaXJlY3Rpb25bMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcy5kaXJlY3Rpb247XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRpcmVjdGlvbiA9PT0gdW5kZWZpbmVkID8gVXRpbGl0eS5EaXJlY3Rpb24uWSA6IGRpcmVjdGlvbjtcbn1cbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnNldERpcmVjdGlvbiA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcbiAgICB0aGlzLl9jb25maWd1cmVkRGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgIHZhciBuZXdEaXJlY3Rpb24gPSBfZ2V0QWN0dWFsRGlyZWN0aW9uLmNhbGwodGhpcywgZGlyZWN0aW9uKTtcbiAgICBpZiAobmV3RGlyZWN0aW9uICE9PSB0aGlzLl9kaXJlY3Rpb24pIHtcbiAgICAgICAgdGhpcy5fZGlyZWN0aW9uID0gbmV3RGlyZWN0aW9uO1xuICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICB9XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuZ2V0RGlyZWN0aW9uID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgIHJldHVybiBhY3R1YWwgPyB0aGlzLl9kaXJlY3Rpb24gOiB0aGlzLl9jb25maWd1cmVkRGlyZWN0aW9uO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmdldFNwZWMgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIGlmICghbm9kZSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2Ygbm9kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9ub2Rlc0J5SWQpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IHRoaXMuX25vZGVzQnlJZFtub2RlXTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fc3BlY3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNwZWMgPSB0aGlzLl9zcGVjc1tpXTtcbiAgICAgICAgaWYgKHNwZWMucmVuZGVyTm9kZSA9PT0gbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHNwZWM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5yZWZsb3dMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24gKGluZGV4T3JJZCwgcmVuZGVyYWJsZSwgaW5zZXJ0U3BlYykge1xuICAgIGlmIChpbmRleE9ySWQgaW5zdGFuY2VvZiBTdHJpbmcgfHwgdHlwZW9mIGluZGV4T3JJZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKHRoaXMuX2RhdGFTb3VyY2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fZGF0YVNvdXJjZSA9IHt9O1xuICAgICAgICAgICAgdGhpcy5fbm9kZXNCeUlkID0gdGhpcy5fZGF0YVNvdXJjZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9ub2Rlc0J5SWRbaW5kZXhPcklkXSA9IHJlbmRlcmFibGU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuX2RhdGFTb3VyY2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fZGF0YVNvdXJjZSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fdmlld1NlcXVlbmNlID0gbmV3IFZpZXdTZXF1ZW5jZSh0aGlzLl9kYXRhU291cmNlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YVNvdXJjZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZSB8fCB0aGlzLl9kYXRhU291cmNlO1xuICAgICAgICBpZiAoaW5kZXhPcklkID09PSAtMSkge1xuICAgICAgICAgICAgZGF0YVNvdXJjZS5wdXNoKHJlbmRlcmFibGUpO1xuICAgICAgICB9IGVsc2UgaWYgKGluZGV4T3JJZCA9PT0gMCkge1xuICAgICAgICAgICAgZGF0YVNvdXJjZS5zcGxpY2UoMCwgMCwgcmVuZGVyYWJsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhU291cmNlLnNwbGljZShpbmRleE9ySWQsIDAsIHJlbmRlcmFibGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpbnNlcnRTcGVjKSB7XG4gICAgICAgIHRoaXMuX25vZGVzLmluc2VydE5vZGUodGhpcy5fbm9kZXMuY3JlYXRlTm9kZShyZW5kZXJhYmxlLCBpbnNlcnRTcGVjKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b1BpcGVFdmVudHMgJiYgcmVuZGVyYWJsZSAmJiByZW5kZXJhYmxlLnBpcGUpIHtcbiAgICAgICAgcmVuZGVyYWJsZS5waXBlKHRoaXMpO1xuICAgICAgICByZW5kZXJhYmxlLnBpcGUodGhpcy5fZXZlbnRPdXRwdXQpO1xuICAgIH1cbiAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKHJlbmRlcmFibGUsIGluc2VydFNwZWMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNlcnQoLTEsIHJlbmRlcmFibGUsIGluc2VydFNwZWMpO1xufTtcbmZ1bmN0aW9uIF9nZXRWaWV3U2VxdWVuY2VBdEluZGV4KGluZGV4KSB7XG4gICAgdmFyIHZpZXdTZXF1ZW5jZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZTtcbiAgICB2YXIgaSA9IHZpZXdTZXF1ZW5jZSA/IHZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpIDogaW5kZXg7XG4gICAgaWYgKGluZGV4ID4gaSkge1xuICAgICAgICB3aGlsZSAodmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICB2aWV3U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgICAgICAgICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSA9IHZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpO1xuICAgICAgICAgICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZpZXdTZXF1ZW5jZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5kZXggPCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaW5kZXggPCBpKSB7XG4gICAgICAgIHdoaWxlICh2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgICAgICAgICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSA9IHZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpO1xuICAgICAgICAgICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZpZXdTZXF1ZW5jZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5kZXggPiBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmlld1NlcXVlbmNlO1xufVxuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuc3dhcCA9IGZ1bmN0aW9uIChpbmRleCwgaW5kZXgyKSB7XG4gICAgaWYgKHRoaXMuX3ZpZXdTZXF1ZW5jZSkge1xuICAgICAgICBfZ2V0Vmlld1NlcXVlbmNlQXRJbmRleC5jYWxsKHRoaXMsIGluZGV4KS5zd2FwKF9nZXRWaWV3U2VxdWVuY2VBdEluZGV4LmNhbGwodGhpcywgaW5kZXgyKSk7XG4gICAgICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoaW5kZXhPcklkLCByZW1vdmVTcGVjKSB7XG4gICAgdmFyIHJlbmRlck5vZGU7XG4gICAgaWYgKHRoaXMuX25vZGVzQnlJZCB8fCBpbmRleE9ySWQgaW5zdGFuY2VvZiBTdHJpbmcgfHwgdHlwZW9mIGluZGV4T3JJZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmVuZGVyTm9kZSA9IHRoaXMuX25vZGVzQnlJZFtpbmRleE9ySWRdO1xuICAgICAgICBpZiAocmVuZGVyTm9kZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX25vZGVzQnlJZFtpbmRleE9ySWRdO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVuZGVyTm9kZSA9IHRoaXMuX2RhdGFTb3VyY2Uuc3BsaWNlKGluZGV4T3JJZCwgMSlbMF07XG4gICAgfVxuICAgIGlmIChyZW5kZXJOb2RlICYmIHJlbW92ZVNwZWMpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXROb2RlQnlSZW5kZXJOb2RlKHJlbmRlck5vZGUpO1xuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmUocmVtb3ZlU3BlYyB8fCB0aGlzLm9wdGlvbnMucmVtb3ZlU3BlYyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlbmRlck5vZGUpIHtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fbm9kZXNCeUlkKSB7XG4gICAgICAgIHZhciBkaXJ0eSA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fbm9kZXNCeUlkKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fbm9kZXNCeUlkW2tleV07XG4gICAgICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRpcnR5KSB7XG4gICAgICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5fZGF0YVNvdXJjZSkge1xuICAgICAgICB0aGlzLnNldERhdGFTb3VyY2UoW10pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5nZXRTaXplID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuc2l6ZTtcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuaWQ7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuY29tbWl0ID0gZnVuY3Rpb24gY29tbWl0KGNvbnRleHQpIHtcbiAgICB2YXIgdHJhbnNmb3JtID0gY29udGV4dC50cmFuc2Zvcm07XG4gICAgdmFyIG9yaWdpbiA9IGNvbnRleHQub3JpZ2luO1xuICAgIHZhciBzaXplID0gY29udGV4dC5zaXplO1xuICAgIHZhciBvcGFjaXR5ID0gY29udGV4dC5vcGFjaXR5O1xuICAgIGlmIChzaXplWzBdICE9PSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzBdIHx8IHNpemVbMV0gIT09IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMV0gfHwgdGhpcy5faXNEaXJ0eSB8fCB0aGlzLl9ub2Rlcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQgfHwgdGhpcy5vcHRpb25zLmFsd2F5c0xheW91dCkge1xuICAgICAgICB2YXIgZXZlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgIHRhcmdldDogdGhpcyxcbiAgICAgICAgICAgICAgICBvbGRTaXplOiB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlLFxuICAgICAgICAgICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgICAgICAgICAgZGlydHk6IHRoaXMuX2lzRGlydHksXG4gICAgICAgICAgICAgICAgdHJ1ZVNpemVSZXF1ZXN0ZWQ6IHRoaXMuX25vZGVzLl90cnVlU2l6ZVJlcXVlc3RlZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgnbGF5b3V0c3RhcnQnLCBldmVudERhdGEpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmZsb3cgJiYgKHRoaXMuX2lzRGlydHkgfHwgdGhpcy5vcHRpb25zLnJlZmxvd09uUmVzaXplICYmIChzaXplWzBdICE9PSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzBdIHx8IHNpemVbMV0gIT09IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMV0pKSkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKCk7XG4gICAgICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgICAgIG5vZGUucmVsZWFzZUxvY2soKTtcbiAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzBdID0gc2l6ZVswXTtcbiAgICAgICAgdGhpcy5fY29udGV4dFNpemVDYWNoZVsxXSA9IHNpemVbMV07XG4gICAgICAgIHRoaXMuX2lzRGlydHkgPSBmYWxzZTtcbiAgICAgICAgdmFyIGxheW91dENvbnRleHQgPSB0aGlzLl9ub2Rlcy5wcmVwYXJlRm9yTGF5b3V0KHRoaXMuX3ZpZXdTZXF1ZW5jZSwgdGhpcy5fbm9kZXNCeUlkLCB7XG4gICAgICAgICAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IHRoaXMuX2RpcmVjdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLl9sYXlvdXQuX2Z1bmN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9sYXlvdXQuX2Z1bmN0aW9uKGxheW91dENvbnRleHQsIHRoaXMuX2xheW91dC5vcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5fbm9kZXMuYnVpbGRTcGVjQW5kRGVzdHJveVVucmVuZGVyZWROb2RlcygpO1xuICAgICAgICB0aGlzLl9jb21taXRPdXRwdXQudGFyZ2V0ID0gcmVzdWx0LnNwZWNzO1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdyZWZsb3cnLCB7IHRhcmdldDogdGhpcyB9KTtcbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgnbGF5b3V0ZW5kJywgZXZlbnREYXRhKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5mbG93KSB7XG4gICAgICAgIHJlc3VsdCA9IHRoaXMuX25vZGVzLmJ1aWxkU3BlY0FuZERlc3Ryb3lVbnJlbmRlcmVkTm9kZXMoKTtcbiAgICAgICAgdGhpcy5fY29tbWl0T3V0cHV0LnRhcmdldCA9IHJlc3VsdC5zcGVjcztcbiAgICAgICAgaWYgKHJlc3VsdC5tb2RpZmllZCkge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgncmVmbG93JywgeyB0YXJnZXQ6IHRoaXMgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fc3BlY3MgPSB0aGlzLl9jb21taXRPdXRwdXQudGFyZ2V0O1xuICAgIHZhciB0YXJnZXQgPSB0aGlzLl9jb21taXRPdXRwdXQudGFyZ2V0O1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gdGFyZ2V0Lmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICB0YXJnZXRbaV0udGFyZ2V0ID0gdGFyZ2V0W2ldLnJlbmRlck5vZGUucmVuZGVyKCk7XG4gICAgfVxuICAgIGlmIChvcmlnaW4gJiYgKG9yaWdpblswXSAhPT0gMCB8fCBvcmlnaW5bMV0gIT09IDApKSB7XG4gICAgICAgIHRyYW5zZm9ybSA9IFRyYW5zZm9ybS5tb3ZlVGhlbihbXG4gICAgICAgICAgICAtc2l6ZVswXSAqIG9yaWdpblswXSxcbiAgICAgICAgICAgIC1zaXplWzFdICogb3JpZ2luWzFdLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLCB0cmFuc2Zvcm0pO1xuICAgIH1cbiAgICB0aGlzLl9jb21taXRPdXRwdXQuc2l6ZSA9IHNpemU7XG4gICAgdGhpcy5fY29tbWl0T3V0cHV0Lm9wYWNpdHkgPSBvcGFjaXR5O1xuICAgIHRoaXMuX2NvbW1pdE91dHB1dC50cmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgcmV0dXJuIHRoaXMuX2NvbW1pdE91dHB1dDtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IExheW91dENvbnRyb2xsZXI7XG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgVHJhbnNmb3JtID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogbnVsbDtcbnZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi9MYXlvdXRVdGlsaXR5Jyk7XG5mdW5jdGlvbiBMYXlvdXROb2RlKHJlbmRlck5vZGUsIHNwZWMpIHtcbiAgICB0aGlzLnJlbmRlck5vZGUgPSByZW5kZXJOb2RlO1xuICAgIHRoaXMuX3NwZWMgPSBzcGVjID8gTGF5b3V0VXRpbGl0eS5jbG9uZVNwZWMoc3BlYykgOiB7fTtcbiAgICB0aGlzLl9zcGVjLnJlbmRlck5vZGUgPSByZW5kZXJOb2RlO1xuICAgIHRoaXMuX3NwZWNNb2RpZmllZCA9IHRydWU7XG4gICAgdGhpcy5faW52YWxpZGF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9yZW1vdmluZyA9IGZhbHNlO1xufVxuTGF5b3V0Tm9kZS5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG59O1xuTGF5b3V0Tm9kZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnJlbmRlck5vZGUgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fc3BlYy5yZW5kZXJOb2RlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3ZpZXdTZXF1ZW5jZSA9IHVuZGVmaW5lZDtcbn07XG5MYXlvdXROb2RlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9pbnZhbGlkYXRlZCA9IGZhbHNlO1xuICAgIHRoaXMudHJ1ZVNpemVSZXF1ZXN0ZWQgPSBmYWxzZTtcbn07XG5MYXlvdXROb2RlLnByb3RvdHlwZS5zZXRTcGVjID0gZnVuY3Rpb24gKHNwZWMpIHtcbiAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSB0cnVlO1xuICAgIGlmIChzcGVjLmFsaWduKSB7XG4gICAgICAgIGlmICghc3BlYy5hbGlnbikge1xuICAgICAgICAgICAgdGhpcy5fc3BlYy5hbGlnbiA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3BlYy5hbGlnblswXSA9IHNwZWMuYWxpZ25bMF07XG4gICAgICAgIHRoaXMuX3NwZWMuYWxpZ25bMV0gPSBzcGVjLmFsaWduWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3NwZWMuYWxpZ24gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChzcGVjLm9yaWdpbikge1xuICAgICAgICBpZiAoIXNwZWMub3JpZ2luKSB7XG4gICAgICAgICAgICB0aGlzLl9zcGVjLm9yaWdpbiA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3BlYy5vcmlnaW5bMF0gPSBzcGVjLm9yaWdpblswXTtcbiAgICAgICAgdGhpcy5fc3BlYy5vcmlnaW5bMV0gPSBzcGVjLm9yaWdpblsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zcGVjLm9yaWdpbiA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHNwZWMuc2l6ZSkge1xuICAgICAgICBpZiAoIXNwZWMuc2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5fc3BlYy5zaXplID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zcGVjLnNpemVbMF0gPSBzcGVjLnNpemVbMF07XG4gICAgICAgIHRoaXMuX3NwZWMuc2l6ZVsxXSA9IHNwZWMuc2l6ZVsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zcGVjLnNpemUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChzcGVjLnRyYW5zZm9ybSkge1xuICAgICAgICBpZiAoIXNwZWMudHJhbnNmb3JtKSB7XG4gICAgICAgICAgICB0aGlzLl9zcGVjLnRyYW5zZm9ybSA9IHNwZWMudHJhbnNmb3JtLnNsaWNlKDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3BlYy50cmFuc2Zvcm1bMF0gPSBzcGVjLnRyYW5zZm9ybVswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3NwZWMudHJhbnNmb3JtID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLl9zcGVjLm9wYWNpdHkgPSBzcGVjLm9wYWNpdHk7XG59O1xuTGF5b3V0Tm9kZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHNldCwgc2l6ZSkge1xuICAgIHRoaXMuX2ludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSB0cnVlO1xuICAgIHRoaXMuX3JlbW92aW5nID0gZmFsc2U7XG4gICAgdmFyIHNwZWMgPSB0aGlzLl9zcGVjO1xuICAgIHNwZWMub3BhY2l0eSA9IHNldC5vcGFjaXR5O1xuICAgIGlmIChzZXQuc2l6ZSkge1xuICAgICAgICBpZiAoIXNwZWMuc2l6ZSkge1xuICAgICAgICAgICAgc3BlYy5zaXplID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICBzcGVjLnNpemVbMF0gPSBzZXQuc2l6ZVswXTtcbiAgICAgICAgc3BlYy5zaXplWzFdID0gc2V0LnNpemVbMV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3BlYy5zaXplID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoc2V0Lm9yaWdpbikge1xuICAgICAgICBpZiAoIXNwZWMub3JpZ2luKSB7XG4gICAgICAgICAgICBzcGVjLm9yaWdpbiA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgc3BlYy5vcmlnaW5bMF0gPSBzZXQub3JpZ2luWzBdO1xuICAgICAgICBzcGVjLm9yaWdpblsxXSA9IHNldC5vcmlnaW5bMV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3BlYy5vcmlnaW4gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChzZXQuYWxpZ24pIHtcbiAgICAgICAgaWYgKCFzcGVjLmFsaWduKSB7XG4gICAgICAgICAgICBzcGVjLmFsaWduID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICBzcGVjLmFsaWduWzBdID0gc2V0LmFsaWduWzBdO1xuICAgICAgICBzcGVjLmFsaWduWzFdID0gc2V0LmFsaWduWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMuYWxpZ24gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChzZXQuc2tldyB8fCBzZXQucm90YXRlIHx8IHNldC5zY2FsZSkge1xuICAgICAgICB0aGlzLl9zcGVjLnRyYW5zZm9ybSA9IFRyYW5zZm9ybS5idWlsZCh7XG4gICAgICAgICAgICB0cmFuc2xhdGU6IHNldC50cmFuc2xhdGUgfHwgW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgc2tldzogc2V0LnNrZXcgfHwgW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgc2NhbGU6IHNldC5zY2FsZSB8fCBbXG4gICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgIDFcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByb3RhdGU6IHNldC5yb3RhdGUgfHwgW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoc2V0LnRyYW5zbGF0ZSkge1xuICAgICAgICB0aGlzLl9zcGVjLnRyYW5zZm9ybSA9IFRyYW5zZm9ybS50cmFuc2xhdGUoc2V0LnRyYW5zbGF0ZVswXSwgc2V0LnRyYW5zbGF0ZVsxXSwgc2V0LnRyYW5zbGF0ZVsyXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3BlYy50cmFuc2Zvcm0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMuc2Nyb2xsTGVuZ3RoID0gc2V0LnNjcm9sbExlbmd0aDtcbn07XG5MYXlvdXROb2RlLnByb3RvdHlwZS5nZXRTcGVjID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3NwZWNNb2RpZmllZCA9IGZhbHNlO1xuICAgIHRoaXMuX3NwZWMucmVtb3ZlZCA9ICF0aGlzLl9pbnZhbGlkYXRlZDtcbiAgICByZXR1cm4gdGhpcy5fc3BlYztcbn07XG5MYXlvdXROb2RlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAocmVtb3ZlU3BlYykge1xuICAgIHRoaXMuX3JlbW92aW5nID0gdHJ1ZTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IExheW91dE5vZGU7XG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJ2YXIgTGF5b3V0Q29udGV4dCA9IHJlcXVpcmUoJy4vTGF5b3V0Q29udGV4dCcpO1xudmFyIExheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuL0xheW91dFV0aWxpdHknKTtcbnZhciBNQVhfUE9PTF9TSVpFID0gMTAwO1xuZnVuY3Rpb24gTGF5b3V0Tm9kZU1hbmFnZXIoTGF5b3V0Tm9kZSwgaW5pdExheW91dE5vZGVGbikge1xuICAgIHRoaXMuTGF5b3V0Tm9kZSA9IExheW91dE5vZGU7XG4gICAgdGhpcy5faW5pdExheW91dE5vZGVGbiA9IGluaXRMYXlvdXROb2RlRm47XG4gICAgdGhpcy5fbGF5b3V0Q291bnQgPSAwO1xuICAgIHRoaXMuX2NvbnRleHQgPSBuZXcgTGF5b3V0Q29udGV4dCh7XG4gICAgICAgIG5leHQ6IF9jb250ZXh0TmV4dC5iaW5kKHRoaXMpLFxuICAgICAgICBwcmV2OiBfY29udGV4dFByZXYuYmluZCh0aGlzKSxcbiAgICAgICAgZ2V0OiBfY29udGV4dEdldC5iaW5kKHRoaXMpLFxuICAgICAgICBzZXQ6IF9jb250ZXh0U2V0LmJpbmQodGhpcyksXG4gICAgICAgIHJlc29sdmVTaXplOiBfY29udGV4dFJlc29sdmVTaXplLmJpbmQodGhpcyksXG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF1cbiAgICB9KTtcbiAgICB0aGlzLl9jb250ZXh0U3RhdGUgPSB7fTtcbiAgICB0aGlzLl9wb29sID0ge1xuICAgICAgICBsYXlvdXROb2RlczogeyBzaXplOiAwIH0sXG4gICAgICAgIHJlc29sdmVTaXplOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdXG4gICAgfTtcbn1cbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5wcmVwYXJlRm9yTGF5b3V0ID0gZnVuY3Rpb24gKHZpZXdTZXF1ZW5jZSwgbm9kZXNCeUlkLCBjb250ZXh0RGF0YSkge1xuICAgIHZhciBub2RlID0gdGhpcy5fZmlyc3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgbm9kZS5yZXNldCgpO1xuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzLl9jb250ZXh0O1xuICAgIHRoaXMuX2xheW91dENvdW50Kys7XG4gICAgdGhpcy5fbm9kZXNCeUlkID0gbm9kZXNCeUlkO1xuICAgIHRoaXMuX3RydWVTaXplUmVxdWVzdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fcmVldmFsVHJ1ZVNpemUgPSBjb250ZXh0RGF0YS5yZWV2YWxUcnVlU2l6ZSB8fCAhY29udGV4dC5zaXplIHx8IGNvbnRleHQuc2l6ZVswXSAhPT0gY29udGV4dERhdGEuc2l6ZVswXSB8fCBjb250ZXh0LnNpemVbMV0gIT09IGNvbnRleHREYXRhLnNpemVbMV07XG4gICAgdmFyIGNvbnRleHRTdGF0ZSA9IHRoaXMuX2NvbnRleHRTdGF0ZTtcbiAgICBjb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlID0gdmlld1NlcXVlbmNlO1xuICAgIGNvbnRleHRTdGF0ZS5wcmV2U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2U7XG4gICAgY29udGV4dFN0YXRlLnN0YXJ0ID0gdW5kZWZpbmVkO1xuICAgIGNvbnRleHRTdGF0ZS5uZXh0R2V0SW5kZXggPSAwO1xuICAgIGNvbnRleHRTdGF0ZS5wcmV2R2V0SW5kZXggPSAwO1xuICAgIGNvbnRleHRTdGF0ZS5uZXh0U2V0SW5kZXggPSAwO1xuICAgIGNvbnRleHRTdGF0ZS5wcmV2U2V0SW5kZXggPSAwO1xuICAgIGNvbnRleHRTdGF0ZS5hZGRDb3VudCA9IDA7XG4gICAgY29udGV4dFN0YXRlLnJlbW92ZUNvdW50ID0gMDtcbiAgICBjb250ZXh0LnNpemVbMF0gPSBjb250ZXh0RGF0YS5zaXplWzBdO1xuICAgIGNvbnRleHQuc2l6ZVsxXSA9IGNvbnRleHREYXRhLnNpemVbMV07XG4gICAgY29udGV4dC5kaXJlY3Rpb24gPSBjb250ZXh0RGF0YS5kaXJlY3Rpb247XG4gICAgY29udGV4dC5yZXZlcnNlID0gY29udGV4dERhdGEucmV2ZXJzZTtcbiAgICBjb250ZXh0LmFsaWdubWVudCA9IGNvbnRleHREYXRhLnJldmVyc2UgPyAxIDogMDtcbiAgICBjb250ZXh0LnNjcm9sbE9mZnNldCA9IGNvbnRleHREYXRhLnNjcm9sbE9mZnNldCB8fCAwO1xuICAgIGNvbnRleHQuc2Nyb2xsU3RhcnQgPSBjb250ZXh0RGF0YS5zY3JvbGxTdGFydCB8fCAwO1xuICAgIGNvbnRleHQuc2Nyb2xsRW5kID0gY29udGV4dERhdGEuc2Nyb2xsRW5kIHx8IGNvbnRleHQuc2l6ZVtjb250ZXh0LmRpcmVjdGlvbl07XG4gICAgcmV0dXJuIGNvbnRleHQ7XG59O1xuTGF5b3V0Tm9kZU1hbmFnZXIucHJvdG90eXBlLnJlbW92ZU5vbkludmFsaWRhdGVkTm9kZXMgPSBmdW5jdGlvbiAocmVtb3ZlU3BlYykge1xuICAgIHZhciBub2RlID0gdGhpcy5fZmlyc3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlLl9pbnZhbGlkYXRlZCAmJiAhbm9kZS5fcmVtb3ZpbmcpIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlKHJlbW92ZVNwZWMpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbn07XG5MYXlvdXROb2RlTWFuYWdlci5wcm90b3R5cGUuYnVpbGRTcGVjQW5kRGVzdHJveVVucmVuZGVyZWROb2RlcyA9IGZ1bmN0aW9uICh0cmFuc2xhdGUpIHtcbiAgICB2YXIgc3BlY3MgPSBbXTtcbiAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICAgICAgc3BlY3M6IHNwZWNzLFxuICAgICAgICAgICAgbW9kaWZpZWQ6IGZhbHNlXG4gICAgICAgIH07XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9maXJzdDtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICB2YXIgbW9kaWZpZWQgPSBub2RlLl9zcGVjTW9kaWZpZWQ7XG4gICAgICAgIHZhciBzcGVjID0gbm9kZS5nZXRTcGVjKCk7XG4gICAgICAgIGlmIChzcGVjLnJlbW92ZWQpIHtcbiAgICAgICAgICAgIHZhciBkZXN0cm95Tm9kZSA9IG5vZGU7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICAgICAgICAgIF9kZXN0cm95Tm9kZS5jYWxsKHRoaXMsIGRlc3Ryb3lOb2RlKTtcbiAgICAgICAgICAgIHJlc3VsdC5tb2RpZmllZCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobW9kaWZpZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3BlYy50cmFuc2Zvcm0gJiYgdHJhbnNsYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwZWMudHJhbnNmb3JtWzEyXSArPSB0cmFuc2xhdGVbMF07XG4gICAgICAgICAgICAgICAgICAgIHNwZWMudHJhbnNmb3JtWzEzXSArPSB0cmFuc2xhdGVbMV07XG4gICAgICAgICAgICAgICAgICAgIHNwZWMudHJhbnNmb3JtWzE0XSArPSB0cmFuc2xhdGVbMl07XG4gICAgICAgICAgICAgICAgICAgIHNwZWMudHJhbnNmb3JtWzEyXSA9IE1hdGgucm91bmQoc3BlYy50cmFuc2Zvcm1bMTJdICogMTAwMDAwKSAvIDEwMDAwMDtcbiAgICAgICAgICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTNdID0gTWF0aC5yb3VuZChzcGVjLnRyYW5zZm9ybVsxM10gKiAxMDAwMDApIC8gMTAwMDAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQubW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3BlY3MucHVzaChzcGVjKTtcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5hZGRDb3VudCA9IDA7XG4gICAgdGhpcy5fY29udGV4dFN0YXRlLnJlbW92ZUNvdW50ID0gMDtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5nZXROb2RlQnlSZW5kZXJOb2RlID0gZnVuY3Rpb24gKHJlbmRlcmFibGUpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX2ZpcnN0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlLnJlbmRlck5vZGUgPT09IHJlbmRlcmFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5pbnNlcnROb2RlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICBub2RlLl9uZXh0ID0gdGhpcy5fZmlyc3Q7XG4gICAgaWYgKHRoaXMuX2ZpcnN0KSB7XG4gICAgICAgIHRoaXMuX2ZpcnN0Ll9wcmV2ID0gbm9kZTtcbiAgICB9XG4gICAgdGhpcy5fZmlyc3QgPSBub2RlO1xufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5zZXROb2RlT3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdGhpcy5fbm9kZU9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHZhciBub2RlID0gdGhpcy5fZmlyc3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgbm9kZS5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG4gICAgbm9kZSA9IHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuZmlyc3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgbm9kZS5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG59O1xuTGF5b3V0Tm9kZU1hbmFnZXIucHJvdG90eXBlLnByZWFsbG9jYXRlTm9kZXMgPSBmdW5jdGlvbiAoY291bnQsIHNwZWMpIHtcbiAgICB2YXIgbm9kZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgbm9kZXMucHVzaCh0aGlzLmNyZWF0ZU5vZGUodW5kZWZpbmVkLCBzcGVjKSk7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgIF9kZXN0cm95Tm9kZS5jYWxsKHRoaXMsIG5vZGVzW2ldKTtcbiAgICB9XG59O1xuTGF5b3V0Tm9kZU1hbmFnZXIucHJvdG90eXBlLmNyZWF0ZU5vZGUgPSBmdW5jdGlvbiAocmVuZGVyTm9kZSwgc3BlYykge1xuICAgIHZhciBub2RlO1xuICAgIGlmICh0aGlzLl9wb29sLmxheW91dE5vZGVzLmZpcnN0KSB7XG4gICAgICAgIG5vZGUgPSB0aGlzLl9wb29sLmxheW91dE5vZGVzLmZpcnN0O1xuICAgICAgICB0aGlzLl9wb29sLmxheW91dE5vZGVzLmZpcnN0ID0gbm9kZS5fbmV4dDtcbiAgICAgICAgdGhpcy5fcG9vbC5sYXlvdXROb2Rlcy5zaXplLS07XG4gICAgICAgIG5vZGUuY29uc3RydWN0b3IuYXBwbHkobm9kZSwgYXJndW1lbnRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBub2RlID0gbmV3IHRoaXMuTGF5b3V0Tm9kZShyZW5kZXJOb2RlLCBzcGVjKTtcbiAgICAgICAgaWYgKHRoaXMuX25vZGVPcHRpb25zKSB7XG4gICAgICAgICAgICBub2RlLnNldE9wdGlvbnModGhpcy5fbm9kZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG5vZGUuX3ByZXYgPSB1bmRlZmluZWQ7XG4gICAgbm9kZS5fbmV4dCA9IHVuZGVmaW5lZDtcbiAgICBub2RlLl92aWV3U2VxdWVuY2UgPSB1bmRlZmluZWQ7XG4gICAgbm9kZS5fbGF5b3V0Q291bnQgPSAwO1xuICAgIGlmICh0aGlzLl9pbml0TGF5b3V0Tm9kZUZuKSB7XG4gICAgICAgIHRoaXMuX2luaXRMYXlvdXROb2RlRm4uY2FsbCh0aGlzLCBub2RlLCBzcGVjKTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG59O1xuZnVuY3Rpb24gX2Rlc3Ryb3lOb2RlKG5vZGUpIHtcbiAgICBpZiAobm9kZS5fbmV4dCkge1xuICAgICAgICBub2RlLl9uZXh0Ll9wcmV2ID0gbm9kZS5fcHJldjtcbiAgICB9XG4gICAgaWYgKG5vZGUuX3ByZXYpIHtcbiAgICAgICAgbm9kZS5fcHJldi5fbmV4dCA9IG5vZGUuX25leHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZmlyc3QgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICBub2RlLmRlc3Ryb3koKTtcbiAgICBpZiAodGhpcy5fcG9vbC5sYXlvdXROb2Rlcy5zaXplIDwgTUFYX1BPT0xfU0laRSkge1xuICAgICAgICB0aGlzLl9wb29sLmxheW91dE5vZGVzLnNpemUrKztcbiAgICAgICAgbm9kZS5fcHJldiA9IHVuZGVmaW5lZDtcbiAgICAgICAgbm9kZS5fbmV4dCA9IHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuZmlyc3Q7XG4gICAgICAgIHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuZmlyc3QgPSBub2RlO1xuICAgIH1cbn1cbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5nZXRTdGFydEVudW1Ob2RlID0gZnVuY3Rpb24gKG5leHQpIHtcbiAgICBpZiAobmV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maXJzdDtcbiAgICB9IGVsc2UgaWYgKG5leHQgPT09IHRydWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydCAmJiB0aGlzLl9jb250ZXh0U3RhdGUuc3RhcnRQcmV2ID8gdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0Ll9uZXh0IDogdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0O1xuICAgIH0gZWxzZSBpZiAobmV4dCA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydCAmJiAhdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0UHJldiA/IHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydC5fcHJldiA6IHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydDtcbiAgICB9XG59O1xuZnVuY3Rpb24gX2NvbnRleHRHZXRDcmVhdGVBbmRPcmRlck5vZGVzKHJlbmRlck5vZGUsIHByZXYpIHtcbiAgICB2YXIgbm9kZTtcbiAgICB2YXIgc3RhdGUgPSB0aGlzLl9jb250ZXh0U3RhdGU7XG4gICAgaWYgKCFzdGF0ZS5zdGFydCkge1xuICAgICAgICBub2RlID0gdGhpcy5fZmlyc3Q7XG4gICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5yZW5kZXJOb2RlID09PSByZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLmNyZWF0ZU5vZGUocmVuZGVyTm9kZSk7XG4gICAgICAgICAgICBub2RlLl9uZXh0ID0gdGhpcy5fZmlyc3Q7XG4gICAgICAgICAgICBpZiAodGhpcy5fZmlyc3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9maXJzdC5fcHJldiA9IG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9maXJzdCA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuc3RhcnQgPSBub2RlO1xuICAgICAgICBzdGF0ZS5zdGFydFByZXYgPSBwcmV2O1xuICAgICAgICBzdGF0ZS5wcmV2ID0gbm9kZTtcbiAgICAgICAgc3RhdGUubmV4dCA9IG5vZGU7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbiAgICBpZiAocHJldikge1xuICAgICAgICBpZiAoc3RhdGUucHJldi5fcHJldiAmJiBzdGF0ZS5wcmV2Ll9wcmV2LnJlbmRlck5vZGUgPT09IHJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgIHN0YXRlLnByZXYgPSBzdGF0ZS5wcmV2Ll9wcmV2O1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlLnByZXY7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc3RhdGUubmV4dC5fbmV4dCAmJiBzdGF0ZS5uZXh0Ll9uZXh0LnJlbmRlck5vZGUgPT09IHJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgIHN0YXRlLm5leHQgPSBzdGF0ZS5uZXh0Ll9uZXh0O1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlLm5leHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbm9kZSA9IHRoaXMuX2ZpcnN0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlLnJlbmRlck5vZGUgPT09IHJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgbm9kZSA9IHRoaXMuY3JlYXRlTm9kZShyZW5kZXJOb2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobm9kZS5fbmV4dCkge1xuICAgICAgICAgICAgbm9kZS5fbmV4dC5fcHJldiA9IG5vZGUuX3ByZXY7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuX3ByZXYpIHtcbiAgICAgICAgICAgIG5vZGUuX3ByZXYuX25leHQgPSBub2RlLl9uZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZmlyc3QgPSBub2RlLl9uZXh0O1xuICAgICAgICB9XG4gICAgICAgIG5vZGUuX25leHQgPSB1bmRlZmluZWQ7XG4gICAgICAgIG5vZGUuX3ByZXYgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChwcmV2KSB7XG4gICAgICAgIGlmIChzdGF0ZS5wcmV2Ll9wcmV2KSB7XG4gICAgICAgICAgICBub2RlLl9wcmV2ID0gc3RhdGUucHJldi5fcHJldjtcbiAgICAgICAgICAgIHN0YXRlLnByZXYuX3ByZXYuX25leHQgPSBub2RlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZmlyc3QgPSBub2RlO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLnByZXYuX3ByZXYgPSBub2RlO1xuICAgICAgICBub2RlLl9uZXh0ID0gc3RhdGUucHJldjtcbiAgICAgICAgc3RhdGUucHJldiA9IG5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHN0YXRlLm5leHQuX25leHQpIHtcbiAgICAgICAgICAgIG5vZGUuX25leHQgPSBzdGF0ZS5uZXh0Ll9uZXh0O1xuICAgICAgICAgICAgc3RhdGUubmV4dC5fbmV4dC5fcHJldiA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUubmV4dC5fbmV4dCA9IG5vZGU7XG4gICAgICAgIG5vZGUuX3ByZXYgPSBzdGF0ZS5uZXh0O1xuICAgICAgICBzdGF0ZS5uZXh0ID0gbm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG59XG5mdW5jdGlvbiBfY29udGV4dE5leHQoKSB7XG4gICAgaWYgKCF0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9jb250ZXh0LnJldmVyc2UpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXF1ZW5jZSA9IHRoaXMuX2NvbnRleHRTdGF0ZS5uZXh0U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgICAgICBpZiAoIXRoaXMuX2NvbnRleHRTdGF0ZS5uZXh0U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIHJlbmRlck5vZGUgPSB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlLmdldCgpO1xuICAgIGlmICghcmVuZGVyTm9kZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlID0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB2YXIgbmV4dFNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXF1ZW5jZTtcbiAgICBpZiAoIXRoaXMuX2NvbnRleHQucmV2ZXJzZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlck5vZGU6IHJlbmRlck5vZGUsXG4gICAgICAgIHZpZXdTZXF1ZW5jZTogbmV4dFNlcXVlbmNlLFxuICAgICAgICBuZXh0OiB0cnVlLFxuICAgICAgICBpbmRleDogKyt0aGlzLl9jb250ZXh0U3RhdGUubmV4dEdldEluZGV4XG4gICAgfTtcbn1cbmZ1bmN0aW9uIF9jb250ZXh0UHJldigpIHtcbiAgICBpZiAoIXRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2VxdWVuY2UpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9jb250ZXh0LnJldmVyc2UpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZSA9IHRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgaWYgKCF0aGlzLl9jb250ZXh0U3RhdGUucHJldlNlcXVlbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciByZW5kZXJOb2RlID0gdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZS5nZXQoKTtcbiAgICBpZiAoIXJlbmRlck5vZGUpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdmFyIHByZXZTZXF1ZW5jZSA9IHRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2VxdWVuY2U7XG4gICAgaWYgKHRoaXMuX2NvbnRleHQucmV2ZXJzZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXJOb2RlOiByZW5kZXJOb2RlLFxuICAgICAgICB2aWV3U2VxdWVuY2U6IHByZXZTZXF1ZW5jZSxcbiAgICAgICAgcHJldjogdHJ1ZSxcbiAgICAgICAgaW5kZXg6IC0tdGhpcy5fY29udGV4dFN0YXRlLnByZXZHZXRJbmRleFxuICAgIH07XG59XG5mdW5jdGlvbiBfY29udGV4dEdldChjb250ZXh0Tm9kZU9ySWQpIHtcbiAgICBpZiAodGhpcy5fbm9kZXNCeUlkICYmIChjb250ZXh0Tm9kZU9ySWQgaW5zdGFuY2VvZiBTdHJpbmcgfHwgdHlwZW9mIGNvbnRleHROb2RlT3JJZCA9PT0gJ3N0cmluZycpKSB7XG4gICAgICAgIHZhciByZW5kZXJOb2RlID0gdGhpcy5fbm9kZXNCeUlkW2NvbnRleHROb2RlT3JJZF07XG4gICAgICAgIGlmICghcmVuZGVyTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVuZGVyTm9kZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IHJlbmRlck5vZGUubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJOb2RlOiByZW5kZXJOb2RlW2ldLFxuICAgICAgICAgICAgICAgICAgICBhcnJheUVsZW1lbnQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlbmRlck5vZGU6IHJlbmRlck5vZGUsXG4gICAgICAgICAgICBieUlkOiB0cnVlXG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNvbnRleHROb2RlT3JJZDtcbiAgICB9XG59XG5mdW5jdGlvbiBfY29udGV4dFNldChjb250ZXh0Tm9kZU9ySWQsIHNldCkge1xuICAgIHZhciBjb250ZXh0Tm9kZSA9IHRoaXMuX25vZGVzQnlJZCA/IF9jb250ZXh0R2V0LmNhbGwodGhpcywgY29udGV4dE5vZGVPcklkKSA6IGNvbnRleHROb2RlT3JJZDtcbiAgICBpZiAoY29udGV4dE5vZGUpIHtcbiAgICAgICAgdmFyIG5vZGUgPSBjb250ZXh0Tm9kZS5ub2RlO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIGlmIChjb250ZXh0Tm9kZS5uZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRleHROb2RlLmluZGV4IDwgdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXRJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBMYXlvdXRVdGlsaXR5LmVycm9yKCdOb2RlcyBtdXN0IGJlIGxheWVkIG91dCBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IHdlcmUgcmVxdWVzdGVkIScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNldEluZGV4ID0gY29udGV4dE5vZGUuaW5kZXg7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHROb2RlLnByZXYpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29udGV4dE5vZGUuaW5kZXggPiB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNldEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIExheW91dFV0aWxpdHkuZXJyb3IoJ05vZGVzIG11c3QgYmUgbGF5ZWQgb3V0IGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgd2VyZSByZXF1ZXN0ZWQhJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2V0SW5kZXggPSBjb250ZXh0Tm9kZS5pbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBfY29udGV4dEdldENyZWF0ZUFuZE9yZGVyTm9kZXMuY2FsbCh0aGlzLCBjb250ZXh0Tm9kZS5yZW5kZXJOb2RlLCBjb250ZXh0Tm9kZS5wcmV2KTtcbiAgICAgICAgICAgIG5vZGUuX3ZpZXdTZXF1ZW5jZSA9IGNvbnRleHROb2RlLnZpZXdTZXF1ZW5jZTtcbiAgICAgICAgICAgIG5vZGUuX2xheW91dENvdW50Kys7XG4gICAgICAgICAgICBpZiAobm9kZS5fbGF5b3V0Q291bnQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUuYWRkQ291bnQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHROb2RlLm5vZGUgPSBub2RlO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUudXNlc1RydWVTaXplID0gY29udGV4dE5vZGUudXNlc1RydWVTaXplO1xuICAgICAgICBub2RlLnRydWVTaXplUmVxdWVzdGVkID0gY29udGV4dE5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQ7XG4gICAgICAgIG5vZGUuc2V0KHNldCwgdGhpcy5fY29udGV4dC5zaXplKTtcbiAgICAgICAgY29udGV4dE5vZGUuc2V0ID0gc2V0O1xuICAgIH1cbn1cbmZ1bmN0aW9uIF9jb250ZXh0UmVzb2x2ZVNpemUoY29udGV4dE5vZGVPcklkLCBwYXJlbnRTaXplKSB7XG4gICAgdmFyIGNvbnRleHROb2RlID0gdGhpcy5fbm9kZXNCeUlkID8gX2NvbnRleHRHZXQuY2FsbCh0aGlzLCBjb250ZXh0Tm9kZU9ySWQpIDogY29udGV4dE5vZGVPcklkO1xuICAgIHZhciByZXNvbHZlU2l6ZSA9IHRoaXMuX3Bvb2wucmVzb2x2ZVNpemU7XG4gICAgaWYgKCFjb250ZXh0Tm9kZSkge1xuICAgICAgICByZXNvbHZlU2l6ZVswXSA9IDA7XG4gICAgICAgIHJlc29sdmVTaXplWzFdID0gMDtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVTaXplO1xuICAgIH1cbiAgICB2YXIgcmVuZGVyTm9kZSA9IGNvbnRleHROb2RlLnJlbmRlck5vZGU7XG4gICAgdmFyIHNpemUgPSByZW5kZXJOb2RlLmdldFNpemUoKTtcbiAgICBpZiAoIXNpemUpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFNpemU7XG4gICAgfVxuICAgIHZhciBjb25maWdTaXplID0gcmVuZGVyTm9kZS5zaXplICYmIHJlbmRlck5vZGUuX3RydWVTaXplQ2hlY2sgIT09IHVuZGVmaW5lZCA/IHJlbmRlck5vZGUuc2l6ZSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoY29uZmlnU2l6ZSAmJiAoY29uZmlnU2l6ZVswXSA9PT0gdHJ1ZSB8fCBjb25maWdTaXplWzFdID09PSB0cnVlKSkge1xuICAgICAgICBjb250ZXh0Tm9kZS51c2VzVHJ1ZVNpemUgPSB0cnVlO1xuICAgICAgICB2YXIgYmFja3VwU2l6ZSA9IHJlbmRlck5vZGUuX2JhY2t1cFNpemU7XG4gICAgICAgIGlmIChyZW5kZXJOb2RlLl90cnVlU2l6ZUNoZWNrKSB7XG4gICAgICAgICAgICBpZiAoYmFja3VwU2l6ZSAmJiBjb25maWdTaXplICE9PSBzaXplKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld1dpZHRoID0gY29uZmlnU2l6ZVswXSA9PT0gdHJ1ZSA/IE1hdGgubWF4KGJhY2t1cFNpemVbMF0sIHNpemVbMF0pIDogc2l6ZVswXTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3SGVpZ2h0ID0gY29uZmlnU2l6ZVsxXSA9PT0gdHJ1ZSA/IE1hdGgubWF4KGJhY2t1cFNpemVbMV0sIHNpemVbMV0pIDogc2l6ZVsxXTtcbiAgICAgICAgICAgICAgICBpZiAobmV3V2lkdGggIT09IGJhY2t1cFNpemVbMF0gfHwgbmV3SGVpZ2h0ICE9PSBiYWNrdXBTaXplWzFdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3RydWVTaXplUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dE5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBiYWNrdXBTaXplWzBdID0gbmV3V2lkdGg7XG4gICAgICAgICAgICAgICAgYmFja3VwU2l6ZVsxXSA9IG5ld0hlaWdodDtcbiAgICAgICAgICAgICAgICBzaXplID0gYmFja3VwU2l6ZTtcbiAgICAgICAgICAgICAgICByZW5kZXJOb2RlLl9iYWNrdXBTaXplID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGJhY2t1cFNpemUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RydWVTaXplUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb250ZXh0Tm9kZS50cnVlU2l6ZVJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3JlZXZhbFRydWVTaXplKSB7XG4gICAgICAgICAgICByZW5kZXJOb2RlLl90cnVlU2l6ZUNoZWNrID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlbmRlck5vZGUuX3NpemVEaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFiYWNrdXBTaXplKSB7XG4gICAgICAgICAgICByZW5kZXJOb2RlLl9iYWNrdXBTaXplID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGJhY2t1cFNpemUgPSByZW5kZXJOb2RlLl9iYWNrdXBTaXplO1xuICAgICAgICB9XG4gICAgICAgIGJhY2t1cFNpemVbMF0gPSBzaXplWzBdO1xuICAgICAgICBiYWNrdXBTaXplWzFdID0gc2l6ZVsxXTtcbiAgICB9XG4gICAgaWYgKHNpemVbMF0gPT09IHVuZGVmaW5lZCB8fCBzaXplWzBdID09PSB0cnVlIHx8IHNpemVbMV0gPT09IHVuZGVmaW5lZCB8fCBzaXplWzFdID09PSB0cnVlKSB7XG4gICAgICAgIHJlc29sdmVTaXplWzBdID0gc2l6ZVswXTtcbiAgICAgICAgcmVzb2x2ZVNpemVbMV0gPSBzaXplWzFdO1xuICAgICAgICBzaXplID0gcmVzb2x2ZVNpemU7XG4gICAgICAgIGlmIChzaXplWzBdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNpemVbMF0gPSBwYXJlbnRTaXplWzBdO1xuICAgICAgICB9IGVsc2UgaWYgKHNpemVbMF0gPT09IHRydWUpIHtcbiAgICAgICAgICAgIHNpemVbMF0gPSAwO1xuICAgICAgICAgICAgdGhpcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgY29udGV4dE5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaXplWzFdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNpemVbMV0gPSBwYXJlbnRTaXplWzFdO1xuICAgICAgICB9IGVsc2UgaWYgKHNpemVbMV0gPT09IHRydWUpIHtcbiAgICAgICAgICAgIHNpemVbMV0gPSAwO1xuICAgICAgICAgICAgdGhpcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgY29udGV4dE5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzaXplO1xufVxubW9kdWxlLmV4cG9ydHMgPSBMYXlvdXROb2RlTWFuYWdlcjsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgVXRpbGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IG51bGw7XG5mdW5jdGlvbiBMYXlvdXRVdGlsaXR5KCkge1xufVxuTGF5b3V0VXRpbGl0eS5yZWdpc3RlcmVkSGVscGVycyA9IHt9O1xudmFyIENhcGFiaWxpdGllcyA9IHtcbiAgICAgICAgU0VRVUVOQ0U6IDEsXG4gICAgICAgIERJUkVDVElPTl9YOiAyLFxuICAgICAgICBESVJFQ1RJT05fWTogNCxcbiAgICAgICAgU0NST0xMSU5HOiA4XG4gICAgfTtcbkxheW91dFV0aWxpdHkuQ2FwYWJpbGl0aWVzID0gQ2FwYWJpbGl0aWVzO1xuTGF5b3V0VXRpbGl0eS5ub3JtYWxpemVNYXJnaW5zID0gZnVuY3Rpb24gKG1hcmdpbnMpIHtcbiAgICBpZiAoIW1hcmdpbnMpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICB9IGVsc2UgaWYgKCFBcnJheS5pc0FycmF5KG1hcmdpbnMpKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBtYXJnaW5zLFxuICAgICAgICAgICAgbWFyZ2lucyxcbiAgICAgICAgICAgIG1hcmdpbnMsXG4gICAgICAgICAgICBtYXJnaW5zXG4gICAgICAgIF07XG4gICAgfSBlbHNlIGlmIChtYXJnaW5zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdO1xuICAgIH0gZWxzZSBpZiAobWFyZ2lucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIG1hcmdpbnNbMF0sXG4gICAgICAgICAgICBtYXJnaW5zWzBdLFxuICAgICAgICAgICAgbWFyZ2luc1swXSxcbiAgICAgICAgICAgIG1hcmdpbnNbMF1cbiAgICAgICAgXTtcbiAgICB9IGVsc2UgaWYgKG1hcmdpbnMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBtYXJnaW5zWzBdLFxuICAgICAgICAgICAgbWFyZ2luc1sxXSxcbiAgICAgICAgICAgIG1hcmdpbnNbMF0sXG4gICAgICAgICAgICBtYXJnaW5zWzFdXG4gICAgICAgIF07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG1hcmdpbnM7XG4gICAgfVxufTtcbkxheW91dFV0aWxpdHkuY2xvbmVTcGVjID0gZnVuY3Rpb24gKHNwZWMpIHtcbiAgICB2YXIgY2xvbmUgPSB7fTtcbiAgICBpZiAoc3BlYy5vcGFjaXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY2xvbmUub3BhY2l0eSA9IHNwZWMub3BhY2l0eTtcbiAgICB9XG4gICAgaWYgKHNwZWMuc2l6ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNsb25lLnNpemUgPSBzcGVjLnNpemUuc2xpY2UoMCk7XG4gICAgfVxuICAgIGlmIChzcGVjLnRyYW5zZm9ybSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNsb25lLnRyYW5zZm9ybSA9IHNwZWMudHJhbnNmb3JtLnNsaWNlKDApO1xuICAgIH1cbiAgICBpZiAoc3BlYy5vcmlnaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjbG9uZS5vcmlnaW4gPSBzcGVjLm9yaWdpbi5zbGljZSgwKTtcbiAgICB9XG4gICAgaWYgKHNwZWMuYWxpZ24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjbG9uZS5hbGlnbiA9IHNwZWMuYWxpZ24uc2xpY2UoMCk7XG4gICAgfVxuICAgIHJldHVybiBjbG9uZTtcbn07XG5mdW5jdGlvbiBfaXNFcXVhbEFycmF5KGEsIGIpIHtcbiAgICBpZiAoYSA9PT0gYikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGEgPT09IHVuZGVmaW5lZCB8fCBiID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgaSA9IGEubGVuZ3RoO1xuICAgIGlmIChpICE9PSBiLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbkxheW91dFV0aWxpdHkuaXNFcXVhbFNwZWMgPSBmdW5jdGlvbiAoc3BlYzEsIHNwZWMyKSB7XG4gICAgaWYgKHNwZWMxLm9wYWNpdHkgIT09IHNwZWMyLm9wYWNpdHkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIV9pc0VxdWFsQXJyYXkoc3BlYzEuc2l6ZSwgc3BlYzIuc2l6ZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIV9pc0VxdWFsQXJyYXkoc3BlYzEudHJhbnNmb3JtLCBzcGVjMi50cmFuc2Zvcm0pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFfaXNFcXVhbEFycmF5KHNwZWMxLm9yaWdpbiwgc3BlYzIub3JpZ2luKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghX2lzRXF1YWxBcnJheShzcGVjMS5hbGlnbiwgc3BlYzIuYWxpZ24pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuTGF5b3V0VXRpbGl0eS5nZXRTcGVjRGlmZlRleHQgPSBmdW5jdGlvbiAoc3BlYzEsIHNwZWMyKSB7XG4gICAgdmFyIHJlc3VsdCA9ICdzcGVjIGRpZmY6JztcbiAgICBpZiAoc3BlYzEub3BhY2l0eSAhPT0gc3BlYzIub3BhY2l0eSkge1xuICAgICAgICByZXN1bHQgKz0gJ1xcbm9wYWNpdHk6ICcgKyBzcGVjMS5vcGFjaXR5ICsgJyAhPSAnICsgc3BlYzIub3BhY2l0eTtcbiAgICB9XG4gICAgaWYgKCFfaXNFcXVhbEFycmF5KHNwZWMxLnNpemUsIHNwZWMyLnNpemUpKSB7XG4gICAgICAgIHJlc3VsdCArPSAnXFxuc2l6ZTogJyArIEpTT04uc3RyaW5naWZ5KHNwZWMxLnNpemUpICsgJyAhPSAnICsgSlNPTi5zdHJpbmdpZnkoc3BlYzIuc2l6ZSk7XG4gICAgfVxuICAgIGlmICghX2lzRXF1YWxBcnJheShzcGVjMS50cmFuc2Zvcm0sIHNwZWMyLnRyYW5zZm9ybSkpIHtcbiAgICAgICAgcmVzdWx0ICs9ICdcXG50cmFuc2Zvcm06ICcgKyBKU09OLnN0cmluZ2lmeShzcGVjMS50cmFuc2Zvcm0pICsgJyAhPSAnICsgSlNPTi5zdHJpbmdpZnkoc3BlYzIudHJhbnNmb3JtKTtcbiAgICB9XG4gICAgaWYgKCFfaXNFcXVhbEFycmF5KHNwZWMxLm9yaWdpbiwgc3BlYzIub3JpZ2luKSkge1xuICAgICAgICByZXN1bHQgKz0gJ1xcbm9yaWdpbjogJyArIEpTT04uc3RyaW5naWZ5KHNwZWMxLm9yaWdpbikgKyAnICE9ICcgKyBKU09OLnN0cmluZ2lmeShzcGVjMi5vcmlnaW4pO1xuICAgIH1cbiAgICBpZiAoIV9pc0VxdWFsQXJyYXkoc3BlYzEuYWxpZ24sIHNwZWMyLmFsaWduKSkge1xuICAgICAgICByZXN1bHQgKz0gJ1xcbmFsaWduOiAnICsgSlNPTi5zdHJpbmdpZnkoc3BlYzEuYWxpZ24pICsgJyAhPSAnICsgSlNPTi5zdHJpbmdpZnkoc3BlYzIuYWxpZ24pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbkxheW91dFV0aWxpdHkuZXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIGNvbnNvbGUubG9nKCdFUlJPUjogJyArIG1lc3NhZ2UpO1xuICAgIHRocm93IG1lc3NhZ2U7XG59O1xuTGF5b3V0VXRpbGl0eS53YXJuaW5nID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmxvZygnV0FSTklORzogJyArIG1lc3NhZ2UpO1xufTtcbkxheW91dFV0aWxpdHkubG9nID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICB2YXIgbWVzc2FnZSA9ICcnO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGlmIChhcmcgaW5zdGFuY2VvZiBPYmplY3QgfHwgYXJnIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gSlNPTi5zdHJpbmdpZnkoYXJnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gYXJnO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xufTtcbkxheW91dFV0aWxpdHkuY29tYmluZU9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9uczEsIG9wdGlvbnMyLCBmb3JjZUNsb25lKSB7XG4gICAgaWYgKG9wdGlvbnMxICYmICFvcHRpb25zMiAmJiAhZm9yY2VDbG9uZSkge1xuICAgICAgICByZXR1cm4gb3B0aW9uczE7XG4gICAgfSBlbHNlIGlmICghb3B0aW9uczEgJiYgb3B0aW9uczIgJiYgIWZvcmNlQ2xvbmUpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMyO1xuICAgIH1cbiAgICB2YXIgb3B0aW9ucyA9IFV0aWxpdHkuY2xvbmUob3B0aW9uczEgfHwge30pO1xuICAgIGlmIChvcHRpb25zMikge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb3B0aW9uczIpIHtcbiAgICAgICAgICAgIG9wdGlvbnNba2V5XSA9IG9wdGlvbnMyW2tleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9wdGlvbnM7XG59O1xuTGF5b3V0VXRpbGl0eS5yZWdpc3RlckhlbHBlciA9IGZ1bmN0aW9uIChuYW1lLCBIZWxwZXIpIHtcbiAgICBpZiAoIUhlbHBlci5wcm90b3R5cGUucGFyc2UpIHtcbiAgICAgICAgTGF5b3V0VXRpbGl0eS5lcnJvcignVGhlIGxheW91dC1oZWxwZXIgZm9yIG5hbWUgXCInICsgbmFtZSArICdcIiBpcyByZXF1aXJlZCB0byBzdXBwb3J0IHRoZSBcInBhcnNlXCIgbWV0aG9kJyk7XG4gICAgfVxuICAgIGlmICh0aGlzLnJlZ2lzdGVyZWRIZWxwZXJzW25hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgTGF5b3V0VXRpbGl0eS53YXJuaW5nKCdBIGxheW91dC1oZWxwZXIgd2l0aCB0aGUgbmFtZSBcIicgKyBuYW1lICsgJ1wiIGlzIGFscmVhZHkgcmVnaXN0ZXJlZCBhbmQgd2lsbCBiZSBvdmVyd3JpdHRlbicpO1xuICAgIH1cbiAgICB0aGlzLnJlZ2lzdGVyZWRIZWxwZXJzW25hbWVdID0gSGVscGVyO1xufTtcbkxheW91dFV0aWxpdHkudW5yZWdpc3RlckhlbHBlciA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgZGVsZXRlIHRoaXMucmVnaXN0ZXJlZEhlbHBlcnNbbmFtZV07XG59O1xuTGF5b3V0VXRpbGl0eS5nZXRSZWdpc3RlcmVkSGVscGVyID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5yZWdpc3RlcmVkSGVscGVyc1tuYW1lXTtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IExheW91dFV0aWxpdHk7XG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgTGF5b3V0VXRpbGl0eSA9IHJlcXVpcmUoJy4vTGF5b3V0VXRpbGl0eScpO1xudmFyIExheW91dENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL0xheW91dENvbnRyb2xsZXInKTtcbnZhciBMYXlvdXROb2RlID0gcmVxdWlyZSgnLi9MYXlvdXROb2RlJyk7XG52YXIgRmxvd0xheW91dE5vZGUgPSByZXF1aXJlKCcuL0Zsb3dMYXlvdXROb2RlJyk7XG52YXIgTGF5b3V0Tm9kZU1hbmFnZXIgPSByZXF1aXJlKCcuL0xheW91dE5vZGVNYW5hZ2VyJyk7XG52YXIgQ29udGFpbmVyU3VyZmFjZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5zdXJmYWNlcy5Db250YWluZXJTdXJmYWNlIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnN1cmZhY2VzLkNvbnRhaW5lclN1cmZhY2UgOiBudWxsO1xudmFyIFRyYW5zZm9ybSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IG51bGw7XG52YXIgRXZlbnRIYW5kbGVyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuRXZlbnRIYW5kbGVyIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuRXZlbnRIYW5kbGVyIDogbnVsbDtcbnZhciBHcm91cCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLkdyb3VwIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuR3JvdXAgOiBudWxsO1xudmFyIFZlY3RvciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5tYXRoLlZlY3RvciA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5tYXRoLlZlY3RvciA6IG51bGw7XG52YXIgUGh5c2ljc0VuZ2luZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5waHlzaWNzLlBoeXNpY3NFbmdpbmUgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMucGh5c2ljcy5QaHlzaWNzRW5naW5lIDogbnVsbDtcbnZhciBQYXJ0aWNsZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5waHlzaWNzLmJvZGllcy5QYXJ0aWNsZSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5waHlzaWNzLmJvZGllcy5QYXJ0aWNsZSA6IG51bGw7XG52YXIgRHJhZyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5waHlzaWNzLmZvcmNlcy5EcmFnIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnBoeXNpY3MuZm9yY2VzLkRyYWcgOiBudWxsO1xudmFyIFNwcmluZyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5waHlzaWNzLmZvcmNlcy5TcHJpbmcgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMucGh5c2ljcy5mb3JjZXMuU3ByaW5nIDogbnVsbDtcbnZhciBTY3JvbGxTeW5jID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmlucHV0cy5TY3JvbGxTeW5jIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmlucHV0cy5TY3JvbGxTeW5jIDogbnVsbDtcbnZhciBWaWV3U2VxdWVuY2UgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuY29yZS5WaWV3U2VxdWVuY2UgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5WaWV3U2VxdWVuY2UgOiBudWxsO1xudmFyIEJvdW5kcyA9IHtcbiAgICAgICAgTk9ORTogMCxcbiAgICAgICAgUFJFVjogMSxcbiAgICAgICAgTkVYVDogMixcbiAgICAgICAgQk9USDogM1xuICAgIH07XG52YXIgU3ByaW5nU291cmNlID0ge1xuICAgICAgICBOT05FOiAnbm9uZScsXG4gICAgICAgIE5FWFRCT1VORFM6ICduZXh0LWJvdW5kcycsXG4gICAgICAgIFBSRVZCT1VORFM6ICdwcmV2LWJvdW5kcycsXG4gICAgICAgIE1JTlNJWkU6ICdtaW5pbWFsLXNpemUnLFxuICAgICAgICBHT1RPU0VRVUVOQ0U6ICdnb3RvLXNlcXVlbmNlJyxcbiAgICAgICAgRU5TVVJFVklTSUJMRTogJ2Vuc3VyZS12aXNpYmxlJyxcbiAgICAgICAgR09UT1BSRVZESVJFQ1RJT046ICdnb3RvLXByZXYtZGlyZWN0aW9uJyxcbiAgICAgICAgR09UT05FWFRESVJFQ1RJT046ICdnb3RvLW5leHQtZGlyZWN0aW9uJyxcbiAgICAgICAgU05BUFBSRVY6ICdzbmFwLXByZXYnLFxuICAgICAgICBTTkFQTkVYVDogJ3NuYXAtbmV4dCdcbiAgICB9O1xuZnVuY3Rpb24gU2Nyb2xsQ29udHJvbGxlcihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IExheW91dFV0aWxpdHkuY29tYmluZU9wdGlvbnMoU2Nyb2xsQ29udHJvbGxlci5ERUZBVUxUX09QVElPTlMsIG9wdGlvbnMpO1xuICAgIHZhciBsYXlvdXRNYW5hZ2VyID0gbmV3IExheW91dE5vZGVNYW5hZ2VyKG9wdGlvbnMuZmxvdyA/IEZsb3dMYXlvdXROb2RlIDogTGF5b3V0Tm9kZSwgX2luaXRMYXlvdXROb2RlLmJpbmQodGhpcykpO1xuICAgIExheW91dENvbnRyb2xsZXIuY2FsbCh0aGlzLCBvcHRpb25zLCBsYXlvdXRNYW5hZ2VyKTtcbiAgICB0aGlzLl9zY3JvbGwgPSB7XG4gICAgICAgIGFjdGl2ZVRvdWNoZXM6IFtdLFxuICAgICAgICBwZTogbmV3IFBoeXNpY3NFbmdpbmUoKSxcbiAgICAgICAgcGFydGljbGU6IG5ldyBQYXJ0aWNsZSh0aGlzLm9wdGlvbnMuc2Nyb2xsUGFydGljbGUpLFxuICAgICAgICBkcmFnRm9yY2U6IG5ldyBEcmFnKHRoaXMub3B0aW9ucy5zY3JvbGxEcmFnKSxcbiAgICAgICAgZnJpY3Rpb25Gb3JjZTogbmV3IERyYWcodGhpcy5vcHRpb25zLnNjcm9sbEZyaWN0aW9uKSxcbiAgICAgICAgc3ByaW5nVmFsdWU6IHVuZGVmaW5lZCxcbiAgICAgICAgc3ByaW5nRm9yY2U6IG5ldyBTcHJpbmcodGhpcy5vcHRpb25zLnNjcm9sbFNwcmluZyksXG4gICAgICAgIHNwcmluZ0VuZFN0YXRlOiBuZXcgVmVjdG9yKFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdKSxcbiAgICAgICAgZ3JvdXBTdGFydDogMCxcbiAgICAgICAgZ3JvdXBUcmFuc2xhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxEZWx0YTogMCxcbiAgICAgICAgbm9ybWFsaXplZFNjcm9sbERlbHRhOiAwLFxuICAgICAgICBzY3JvbGxGb3JjZTogMCxcbiAgICAgICAgc2Nyb2xsRm9yY2VDb3VudDogMCxcbiAgICAgICAgdW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0OiAwLFxuICAgICAgICBpc1Njcm9sbGluZzogZmFsc2VcbiAgICB9O1xuICAgIHRoaXMuX2RlYnVnID0ge1xuICAgICAgICBsYXlvdXRDb3VudDogMCxcbiAgICAgICAgY29tbWl0Q291bnQ6IDBcbiAgICB9O1xuICAgIHRoaXMuZ3JvdXAgPSBuZXcgR3JvdXAoKTtcbiAgICB0aGlzLmdyb3VwLmFkZCh7IHJlbmRlcjogX2lubmVyUmVuZGVyLmJpbmQodGhpcykgfSk7XG4gICAgdGhpcy5fc2Nyb2xsLnBlLmFkZEJvZHkodGhpcy5fc2Nyb2xsLnBhcnRpY2xlKTtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5zY3JvbGxEcmFnLmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5kcmFnRm9yY2VJZCA9IHRoaXMuX3Njcm9sbC5wZS5hdHRhY2godGhpcy5fc2Nyb2xsLmRyYWdGb3JjZSwgdGhpcy5fc2Nyb2xsLnBhcnRpY2xlKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuc2Nyb2xsRnJpY3Rpb24uZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLmZyaWN0aW9uRm9yY2VJZCA9IHRoaXMuX3Njcm9sbC5wZS5hdHRhY2godGhpcy5fc2Nyb2xsLmZyaWN0aW9uRm9yY2UsIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZSk7XG4gICAgfVxuICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdGb3JjZS5zZXRPcHRpb25zKHsgYW5jaG9yOiB0aGlzLl9zY3JvbGwuc3ByaW5nRW5kU3RhdGUgfSk7XG4gICAgdGhpcy5fZXZlbnRJbnB1dC5vbigndG91Y2hzdGFydCcsIF90b3VjaFN0YXJ0LmJpbmQodGhpcykpO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQub24oJ3RvdWNobW92ZScsIF90b3VjaE1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5fZXZlbnRJbnB1dC5vbigndG91Y2hlbmQnLCBfdG91Y2hFbmQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5fZXZlbnRJbnB1dC5vbigndG91Y2hjYW5jZWwnLCBfdG91Y2hFbmQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5fZXZlbnRJbnB1dC5vbignbW91c2Vkb3duJywgX21vdXNlRG93bi5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl9ldmVudElucHV0Lm9uKCdtb3VzZXVwJywgX21vdXNlVXAuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5fZXZlbnRJbnB1dC5vbignbW91c2Vtb3ZlJywgX21vdXNlTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl9zY3JvbGxTeW5jID0gbmV3IFNjcm9sbFN5bmModGhpcy5vcHRpb25zLnNjcm9sbFN5bmMpO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQucGlwZSh0aGlzLl9zY3JvbGxTeW5jKTtcbiAgICB0aGlzLl9zY3JvbGxTeW5jLm9uKCd1cGRhdGUnLCBfc2Nyb2xsVXBkYXRlLmJpbmQodGhpcykpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMudXNlQ29udGFpbmVyKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gbmV3IENvbnRhaW5lclN1cmZhY2UoeyBwcm9wZXJ0aWVzOiB7IG92ZXJmbG93OiB0aGlzLm9wdGlvbnMudXNlQ29udGFpbmVyT3ZlcmZsb3cgfSB9KTtcbiAgICAgICAgdGhpcy5jb250YWluZXIuYWRkKHtcbiAgICAgICAgICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlkO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hdXRvUGlwZUV2ZW50cykge1xuICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmUodGhpcy5jb250YWluZXIpO1xuICAgICAgICAgICAgRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcih0aGlzLmNvbnRhaW5lciwgdGhpcyk7XG4gICAgICAgICAgICBFdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcih0aGlzLmNvbnRhaW5lciwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUpO1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTY3JvbGxDb250cm9sbGVyO1xuU2Nyb2xsQ29udHJvbGxlci5Cb3VuZHMgPSBCb3VuZHM7XG5TY3JvbGxDb250cm9sbGVyLkRFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBmbG93OiBmYWxzZSxcbiAgICB1c2VDb250YWluZXI6IGZhbHNlLFxuICAgIHVzZUNvbnRhaW5lck92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICB2aXNpYmxlSXRlbVRocmVzc2hvbGQ6IDAuNSxcbiAgICBzY3JvbGxQYXJ0aWNsZToge30sXG4gICAgc2Nyb2xsRHJhZzoge1xuICAgICAgICBmb3JjZUZ1bmN0aW9uOiBEcmFnLkZPUkNFX0ZVTkNUSU9OUy5RVUFEUkFUSUMsXG4gICAgICAgIHN0cmVuZ3RoOiAwLjAwMSxcbiAgICAgICAgZGlzYWJsZWQ6IHRydWVcbiAgICB9LFxuICAgIHNjcm9sbEZyaWN0aW9uOiB7XG4gICAgICAgIGZvcmNlRnVuY3Rpb246IERyYWcuRk9SQ0VfRlVOQ1RJT05TLkxJTkVBUixcbiAgICAgICAgc3RyZW5ndGg6IDAuMDAyNSxcbiAgICAgICAgZGlzYWJsZWQ6IGZhbHNlXG4gICAgfSxcbiAgICBzY3JvbGxTcHJpbmc6IHtcbiAgICAgICAgZGFtcGluZ1JhdGlvOiAxLFxuICAgICAgICBwZXJpb2Q6IDM1MFxuICAgIH0sXG4gICAgc2Nyb2xsU3luYzogeyBzY2FsZTogMC4yIH0sXG4gICAgcGFnaW5hdGVkOiBmYWxzZSxcbiAgICBwYWdpbmF0aW9uRW5lcmd5VGhyZXNzaG9sZDogMC4wMDUsXG4gICAgYWxpZ25tZW50OiAwLFxuICAgIHRvdWNoTW92ZURpcmVjdGlvblRocmVzc2hvbGQ6IHVuZGVmaW5lZCxcbiAgICBtb3VzZU1vdmU6IGZhbHNlLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgbGF5b3V0QWxsOiBmYWxzZSxcbiAgICBhbHdheXNMYXlvdXQ6IGZhbHNlLFxuICAgIGV4dHJhQm91bmRzU3BhY2U6IFtcbiAgICAgICAgMTAwLFxuICAgICAgICAxMDBcbiAgICBdLFxuICAgIGRlYnVnOiBmYWxzZVxufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIExheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnNldE9wdGlvbnMuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICBpZiAodGhpcy5fc2Nyb2xsKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnNjcm9sbFNwcmluZykge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlLnNldE9wdGlvbnMob3B0aW9ucy5zY3JvbGxTcHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLnNjcm9sbERyYWcpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5kcmFnRm9yY2Uuc2V0T3B0aW9ucyhvcHRpb25zLnNjcm9sbERyYWcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChvcHRpb25zLnNjcm9sbFN5bmMgJiYgdGhpcy5fc2Nyb2xsU3luYykge1xuICAgICAgICB0aGlzLl9zY3JvbGxTeW5jLnNldE9wdGlvbnMob3B0aW9ucy5zY3JvbGxTeW5jKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuZnVuY3Rpb24gX2luaXRMYXlvdXROb2RlKG5vZGUsIHNwZWMpIHtcbiAgICBpZiAoIXNwZWMgJiYgdGhpcy5vcHRpb25zLmluc2VydFNwZWMpIHtcbiAgICAgICAgbm9kZS5zZXRTcGVjKHRoaXMub3B0aW9ucy5pbnNlcnRTcGVjKTtcbiAgICB9XG59XG5mdW5jdGlvbiBfbG9nKGFyZ3MpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kZWJ1Zykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBtZXNzYWdlID0gdGhpcy5fZGVidWcuY29tbWl0Q291bnQgKyAnOiAnO1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICB2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBpZiAoYXJnIGluc3RhbmNlb2YgT2JqZWN0IHx8IGFyZyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9IEpTT04uc3RyaW5naWZ5KGFyZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9IGFyZztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbn1cbmZ1bmN0aW9uIF91cGRhdGVTcHJpbmcoKSB7XG4gICAgdmFyIHNwcmluZ1ZhbHVlID0gdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQgPyB1bmRlZmluZWQgOiB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb247XG4gICAgaWYgKHRoaXMuX3Njcm9sbC5zcHJpbmdWYWx1ZSAhPT0gc3ByaW5nVmFsdWUpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1ZhbHVlID0gc3ByaW5nVmFsdWU7XG4gICAgICAgIGlmIChzcHJpbmdWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlSWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5wZS5kZXRhY2godGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlSWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdGb3JjZUlkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3Njcm9sbC5zcHJpbmdGb3JjZUlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nRm9yY2VJZCA9IHRoaXMuX3Njcm9sbC5wZS5hdHRhY2godGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlLCB0aGlzLl9zY3JvbGwucGFydGljbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ0VuZFN0YXRlLnNldDFEKHNwcmluZ1ZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5wZS53YWtlKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBfbW91c2VEb3duKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubW91c2VNb3ZlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUpIHtcbiAgICAgICAgdGhpcy5yZWxlYXNlU2Nyb2xsRm9yY2UodGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5kZWx0YSk7XG4gICAgfVxuICAgIHZhciBjdXJyZW50ID0gW1xuICAgICAgICAgICAgZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIGV2ZW50LmNsaWVudFlcbiAgICAgICAgXTtcbiAgICB2YXIgdGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZSA9IHtcbiAgICAgICAgZGVsdGE6IDAsXG4gICAgICAgIHN0YXJ0OiBjdXJyZW50LFxuICAgICAgICBjdXJyZW50OiBjdXJyZW50LFxuICAgICAgICBwcmV2OiBjdXJyZW50LFxuICAgICAgICB0aW1lOiB0aW1lLFxuICAgICAgICBwcmV2VGltZTogdGltZVxuICAgIH07XG4gICAgdGhpcy5hcHBseVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuZGVsdGEpO1xufVxuZnVuY3Rpb24gX21vdXNlTW92ZShldmVudCkge1xuICAgIGlmICghdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZSB8fCAhdGhpcy5vcHRpb25zLmVuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbW92ZURpcmVjdGlvbiA9IE1hdGguYXRhbjIoTWF0aC5hYnMoZXZlbnQuY2xpZW50WSAtIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUucHJldlsxXSksIE1hdGguYWJzKGV2ZW50LmNsaWVudFggLSB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnByZXZbMF0pKSAvIChNYXRoLlBJIC8gMik7XG4gICAgdmFyIGRpcmVjdGlvbkRpZmYgPSBNYXRoLmFicyh0aGlzLl9kaXJlY3Rpb24gLSBtb3ZlRGlyZWN0aW9uKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRvdWNoTW92ZURpcmVjdGlvblRocmVzc2hvbGQgPT09IHVuZGVmaW5lZCB8fCBkaXJlY3Rpb25EaWZmIDw9IHRoaXMub3B0aW9ucy50b3VjaE1vdmVEaXJlY3Rpb25UaHJlc3Nob2xkKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUucHJldiA9IHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuY3VycmVudDtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5jdXJyZW50ID0gW1xuICAgICAgICAgICAgZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIGV2ZW50LmNsaWVudFlcbiAgICAgICAgXTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5wcmV2VGltZSA9IHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUudGltZTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5kaXJlY3Rpb24gPSBtb3ZlRGlyZWN0aW9uO1xuICAgICAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cbiAgICB2YXIgZGVsdGEgPSB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLmN1cnJlbnRbdGhpcy5fZGlyZWN0aW9uXSAtIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuc3RhcnRbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICB0aGlzLnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuZGVsdGEsIGRlbHRhKTtcbiAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLmRlbHRhID0gZGVsdGE7XG59XG5mdW5jdGlvbiBfbW91c2VVcChldmVudCkge1xuICAgIGlmICghdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB2ZWxvY2l0eSA9IDA7XG4gICAgdmFyIGRpZmZUaW1lID0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS50aW1lIC0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5wcmV2VGltZTtcbiAgICBpZiAoZGlmZlRpbWUgPiAwKSB7XG4gICAgICAgIHZhciBkaWZmT2Zmc2V0ID0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5jdXJyZW50W3RoaXMuX2RpcmVjdGlvbl0gLSB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnByZXZbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICAgICAgdmVsb2NpdHkgPSBkaWZmT2Zmc2V0IC8gZGlmZlRpbWU7XG4gICAgfVxuICAgIHRoaXMucmVsZWFzZVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuZGVsdGEsIHZlbG9jaXR5KTtcbiAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlID0gdW5kZWZpbmVkO1xufVxuZnVuY3Rpb24gX3RvdWNoU3RhcnQoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMuX3RvdWNoRW5kRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl90b3VjaEVuZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuX3RvdWNoRW5kRXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICBfdG91Y2hFbmQuY2FsbCh0aGlzLCBldmVudCk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICB9XG4gICAgdmFyIG9sZFRvdWNoZXNDb3VudCA9IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aDtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGo7XG4gICAgdmFyIHRvdWNoRm91bmQ7XG4gICAgd2hpbGUgKGkgPCB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGFjdGl2ZVRvdWNoID0gdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXNbaV07XG4gICAgICAgIHRvdWNoRm91bmQgPSBmYWxzZTtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGV2ZW50LnRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciB0b3VjaCA9IGV2ZW50LnRvdWNoZXNbal07XG4gICAgICAgICAgICBpZiAodG91Y2guaWRlbnRpZmllciA9PT0gYWN0aXZlVG91Y2guaWQpIHtcbiAgICAgICAgICAgICAgICB0b3VjaEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvdWNoRm91bmQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZXZlbnQudG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhbmdlZFRvdWNoID0gZXZlbnQudG91Y2hlc1tpXTtcbiAgICAgICAgdG91Y2hGb3VuZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlc1tqXS5pZCA9PT0gY2hhbmdlZFRvdWNoLmlkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICB0b3VjaEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvdWNoRm91bmQpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gW1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkVG91Y2guY2xpZW50WCxcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlZFRvdWNoLmNsaWVudFlcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgdmFyIHRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgaWQ6IGNoYW5nZWRUb3VjaC5pZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBjdXJyZW50LFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IGN1cnJlbnQsXG4gICAgICAgICAgICAgICAgcHJldjogY3VycmVudCxcbiAgICAgICAgICAgICAgICB0aW1lOiB0aW1lLFxuICAgICAgICAgICAgICAgIHByZXZUaW1lOiB0aW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNoYW5nZWRUb3VjaC50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl90b3VjaEVuZEV2ZW50TGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghb2xkVG91Y2hlc0NvdW50ICYmIHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmFwcGx5U2Nyb2xsRm9yY2UoMCk7XG4gICAgICAgIHRoaXMuX3Njcm9sbC50b3VjaERlbHRhID0gMDtcbiAgICB9XG59XG5mdW5jdGlvbiBfdG91Y2hNb3ZlKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBwcmltYXJ5VG91Y2g7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhbmdlZFRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbaV07XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciB0b3VjaCA9IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzW2pdO1xuICAgICAgICAgICAgaWYgKHRvdWNoLmlkID09PSBjaGFuZ2VkVG91Y2guaWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgIHZhciBtb3ZlRGlyZWN0aW9uID0gTWF0aC5hdGFuMihNYXRoLmFicyhjaGFuZ2VkVG91Y2guY2xpZW50WSAtIHRvdWNoLnByZXZbMV0pLCBNYXRoLmFicyhjaGFuZ2VkVG91Y2guY2xpZW50WCAtIHRvdWNoLnByZXZbMF0pKSAvIChNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbkRpZmYgPSBNYXRoLmFicyh0aGlzLl9kaXJlY3Rpb24gLSBtb3ZlRGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRvdWNoTW92ZURpcmVjdGlvblRocmVzc2hvbGQgPT09IHVuZGVmaW5lZCB8fCBkaXJlY3Rpb25EaWZmIDw9IHRoaXMub3B0aW9ucy50b3VjaE1vdmVEaXJlY3Rpb25UaHJlc3Nob2xkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoLnByZXYgPSB0b3VjaC5jdXJyZW50O1xuICAgICAgICAgICAgICAgICAgICB0b3VjaC5jdXJyZW50ID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlZFRvdWNoLmNsaWVudFgsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkVG91Y2guY2xpZW50WVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICB0b3VjaC5wcmV2VGltZSA9IHRvdWNoLnRpbWU7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoLmRpcmVjdGlvbiA9IG1vdmVEaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoLnRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICBwcmltYXJ5VG91Y2ggPSBqID09PSAwID8gdG91Y2ggOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChwcmltYXJ5VG91Y2gpIHtcbiAgICAgICAgdmFyIGRlbHRhID0gcHJpbWFyeVRvdWNoLmN1cnJlbnRbdGhpcy5fZGlyZWN0aW9uXSAtIHByaW1hcnlUb3VjaC5zdGFydFt0aGlzLl9kaXJlY3Rpb25dO1xuICAgICAgICB0aGlzLnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC50b3VjaERlbHRhLCBkZWx0YSk7XG4gICAgICAgIHRoaXMuX3Njcm9sbC50b3VjaERlbHRhID0gZGVsdGE7XG4gICAgfVxufVxuZnVuY3Rpb24gX3RvdWNoRW5kKGV2ZW50KSB7XG4gICAgdmFyIHByaW1hcnlUb3VjaCA9IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aCA/IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzWzBdIDogdW5kZWZpbmVkO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoYW5nZWRUb3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzW2ldO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgdG91Y2ggPSB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlc1tqXTtcbiAgICAgICAgICAgIGlmICh0b3VjaC5pZCA9PT0gY2hhbmdlZFRvdWNoLmlkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlcy5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKGogPT09IDAgJiYgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdQcmltYXJ5VG91Y2ggPSB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UHJpbWFyeVRvdWNoLnN0YXJ0WzBdID0gbmV3UHJpbWFyeVRvdWNoLmN1cnJlbnRbMF0gLSAodG91Y2guY3VycmVudFswXSAtIHRvdWNoLnN0YXJ0WzBdKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UHJpbWFyeVRvdWNoLnN0YXJ0WzFdID0gbmV3UHJpbWFyeVRvdWNoLmN1cnJlbnRbMV0gLSAodG91Y2guY3VycmVudFsxXSAtIHRvdWNoLnN0YXJ0WzFdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFwcmltYXJ5VG91Y2ggfHwgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHZlbG9jaXR5ID0gMDtcbiAgICB2YXIgZGlmZlRpbWUgPSBwcmltYXJ5VG91Y2gudGltZSAtIHByaW1hcnlUb3VjaC5wcmV2VGltZTtcbiAgICBpZiAoZGlmZlRpbWUgPiAwKSB7XG4gICAgICAgIHZhciBkaWZmT2Zmc2V0ID0gcHJpbWFyeVRvdWNoLmN1cnJlbnRbdGhpcy5fZGlyZWN0aW9uXSAtIHByaW1hcnlUb3VjaC5wcmV2W3RoaXMuX2RpcmVjdGlvbl07XG4gICAgICAgIHZlbG9jaXR5ID0gZGlmZk9mZnNldCAvIGRpZmZUaW1lO1xuICAgIH1cbiAgICB2YXIgZGVsdGEgPSB0aGlzLl9zY3JvbGwudG91Y2hEZWx0YTtcbiAgICB0aGlzLnJlbGVhc2VTY3JvbGxGb3JjZShkZWx0YSwgdmVsb2NpdHkpO1xuICAgIHRoaXMuX3Njcm9sbC50b3VjaERlbHRhID0gMDtcbn1cbmZ1bmN0aW9uIF9zY3JvbGxVcGRhdGUoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5lbmFibGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG9mZnNldCA9IEFycmF5LmlzQXJyYXkoZXZlbnQuZGVsdGEpID8gZXZlbnQuZGVsdGFbdGhpcy5fZGlyZWN0aW9uXSA6IGV2ZW50LmRlbHRhO1xuICAgIHRoaXMuc2Nyb2xsKG9mZnNldCk7XG59XG5mdW5jdGlvbiBfc2V0UGFydGljbGUocG9zaXRpb24sIHZlbG9jaXR5LCBwaGFzZSkge1xuICAgIGlmIChwb3NpdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZVZhbHVlID0gcG9zaXRpb247XG4gICAgICAgIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZS5zZXRQb3NpdGlvbjFEKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgaWYgKHZlbG9jaXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIG9sZFZlbG9jaXR5ID0gdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLmdldFZlbG9jaXR5MUQoKTtcbiAgICAgICAgaWYgKG9sZFZlbG9jaXR5ICE9PSB2ZWxvY2l0eSkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLnNldFZlbG9jaXR5MUQodmVsb2NpdHkpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gX2NhbGNTY3JvbGxPZmZzZXQobm9ybWFsaXplLCByZWZyZXNoUGFydGljbGUpIHtcbiAgICBpZiAocmVmcmVzaFBhcnRpY2xlIHx8IHRoaXMuX3Njcm9sbC5wYXJ0aWNsZVZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnBhcnRpY2xlVmFsdWUgPSB0aGlzLl9zY3JvbGwucGFydGljbGUuZ2V0UG9zaXRpb24xRCgpO1xuICAgICAgICB0aGlzLl9zY3JvbGwucGFydGljbGVWYWx1ZSA9IE1hdGgucm91bmQodGhpcy5fc2Nyb2xsLnBhcnRpY2xlVmFsdWUgKiAxMDAwKSAvIDEwMDA7XG4gICAgfVxuICAgIHZhciBzY3JvbGxPZmZzZXQgPSB0aGlzLl9zY3JvbGwucGFydGljbGVWYWx1ZTtcbiAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbERlbHRhIHx8IHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGEpIHtcbiAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IHRoaXMuX3Njcm9sbC5zY3JvbGxEZWx0YSArIHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGE7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCAmIEJvdW5kcy5QUkVWICYmIHNjcm9sbE9mZnNldCA+IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiB8fCB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCAmIEJvdW5kcy5ORVhUICYmIHNjcm9sbE9mZnNldCA8IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiB8fCB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9PT0gQm91bmRzLkJPVEgpIHtcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldCA9IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9ybWFsaXplKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3Njcm9sbC5zY3JvbGxEZWx0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGEgPSAwO1xuICAgICAgICAgICAgICAgIF9zZXRQYXJ0aWNsZS5jYWxsKHRoaXMsIHNjcm9sbE9mZnNldCwgdW5kZWZpbmVkLCAnX2NhbGNTY3JvbGxPZmZzZXQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGEgKz0gdGhpcy5fc2Nyb2xsLnNjcm9sbERlbHRhO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNjcm9sbERlbHRhID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQgJiYgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ID0gKHNjcm9sbE9mZnNldCArIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZSArIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbikgLyAyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2Nyb2xsT2Zmc2V0O1xufVxuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuX2NhbGNTY3JvbGxIZWlnaHQgPSBmdW5jdGlvbiAobmV4dCkge1xuICAgIHZhciBjYWxjZWRIZWlnaHQgPSAwO1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZShuZXh0KTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAobm9kZS5faW52YWxpZGF0ZWQpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnRydWVTaXplUmVxdWVzdGVkKSB7XG4gICAgICAgICAgICAgICAgY2FsY2VkSGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vZGUuc2Nyb2xsTGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjYWxjZWRIZWlnaHQgKz0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5leHQgPyBub2RlLl9uZXh0IDogbm9kZS5fcHJldjtcbiAgICB9XG4gICAgcmV0dXJuIGNhbGNlZEhlaWdodDtcbn07XG5mdW5jdGlvbiBfY2FsY0JvdW5kcyhzaXplLCBzY3JvbGxPZmZzZXQpIHtcbiAgICB2YXIgcHJldkhlaWdodCA9IHRoaXMuX2NhbGNTY3JvbGxIZWlnaHQoZmFsc2UpO1xuICAgIHZhciBuZXh0SGVpZ2h0ID0gdGhpcy5fY2FsY1Njcm9sbEhlaWdodCh0cnVlKTtcbiAgICBpZiAocHJldkhlaWdodCA9PT0gdW5kZWZpbmVkIHx8IG5leHRIZWlnaHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5OT05FO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuTk9ORTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdG90YWxIZWlnaHQ7XG4gICAgaWYgKG5leHRIZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBwcmV2SGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdG90YWxIZWlnaHQgPSBwcmV2SGVpZ2h0ICsgbmV4dEhlaWdodDtcbiAgICB9XG4gICAgaWYgKHRvdGFsSGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgdG90YWxIZWlnaHQgPD0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkID0gQm91bmRzLkJPVEg7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPyAtbmV4dEhlaWdodCA6IHByZXZIZWlnaHQ7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuTUlOU0laRTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICBpZiAobmV4dEhlaWdodCAhPT0gdW5kZWZpbmVkICYmIHNjcm9sbE9mZnNldCArIG5leHRIZWlnaHQgPD0gMCkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmJvdW5kc1JlYWNoZWQgPSBCb3VuZHMuTkVYVDtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IC1uZXh0SGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5ORVhUQk9VTkRTO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHByZXZIZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBzY3JvbGxPZmZzZXQgLSBwcmV2SGVpZ2h0ID49IDApIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkID0gQm91bmRzLlBSRVY7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5QUkVWQk9VTkRTO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgIGlmIChwcmV2SGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgc2Nyb2xsT2Zmc2V0IC0gcHJldkhlaWdodCA+PSAtc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5QUkVWO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gLXNpemVbdGhpcy5fZGlyZWN0aW9uXSArIHByZXZIZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLlBSRVZCT1VORFM7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobmV4dEhlaWdodCAhPT0gdW5kZWZpbmVkICYmIHNjcm9sbE9mZnNldCArIG5leHRIZWlnaHQgPD0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5ORVhUO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dIC0gbmV4dEhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuTkVYVEJPVU5EUztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5OT05FO1xuICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLk5PTkU7XG59XG5mdW5jdGlvbiBfY2FsY1Njcm9sbFRvT2Zmc2V0KHNpemUsIHNjcm9sbE9mZnNldCkge1xuICAgIHZhciBzY3JvbGxUb1NlcXVlbmNlID0gdGhpcy5fc2Nyb2xsLnNjcm9sbFRvU2VxdWVuY2UgfHwgdGhpcy5fc2Nyb2xsLmVuc3VyZVZpc2libGVTZXF1ZW5jZTtcbiAgICBpZiAoIXNjcm9sbFRvU2VxdWVuY2UpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2Nyb2xsLmJvdW5kc1JlYWNoZWQgPT09IEJvdW5kcy5CT1RIIHx8ICF0aGlzLl9zY3JvbGwuc2Nyb2xsVG9EaXJlY3Rpb24gJiYgdGhpcy5fc2Nyb2xsLmJvdW5kc1JlYWNoZWQgPT09IEJvdW5kcy5QUkVWIHx8IHRoaXMuX3Njcm9sbC5zY3JvbGxUb0RpcmVjdGlvbiAmJiB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9PT0gQm91bmRzLk5FWFQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZm91bmROb2RlO1xuICAgIHZhciBzY3JvbGxUb09mZnNldCA9IDA7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKHRydWUpO1xuICAgIHZhciBjb3VudCA9IDA7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgY291bnQrKztcbiAgICAgICAgaWYgKCFub2RlLl9pbnZhbGlkYXRlZCB8fCBub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgc2Nyb2xsVG9PZmZzZXQgLT0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuX3ZpZXdTZXF1ZW5jZSA9PT0gc2Nyb2xsVG9TZXF1ZW5jZSkge1xuICAgICAgICAgICAgZm91bmROb2RlID0gbm9kZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgc2Nyb2xsVG9PZmZzZXQgLT0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgfVxuICAgIGlmICghZm91bmROb2RlKSB7XG4gICAgICAgIHNjcm9sbFRvT2Zmc2V0ID0gMDtcbiAgICAgICAgbm9kZSA9IHRoaXMuX25vZGVzLmdldFN0YXJ0RW51bU5vZGUoZmFsc2UpO1xuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgaWYgKCFub2RlLl9pbnZhbGlkYXRlZCB8fCBub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxUb09mZnNldCArPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlLl92aWV3U2VxdWVuY2UgPT09IHNjcm9sbFRvU2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICBmb3VuZE5vZGUgPSBub2RlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxUb09mZnNldCArPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBub2RlLl9wcmV2O1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChmb3VuZE5vZGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3Njcm9sbC5lbnN1cmVWaXNpYmxlU2VxdWVuY2UpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcm9sbFRvT2Zmc2V0IC0gZm91bmROb2RlLnNjcm9sbExlbmd0aCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2Nyb2xsVG9PZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuRU5TVVJFVklTSUJMRTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNjcm9sbFRvT2Zmc2V0ID4gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHNpemVbdGhpcy5fZGlyZWN0aW9uXSAtIHNjcm9sbFRvT2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLkVOU1VSRVZJU0lCTEU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmVuc3VyZVZpc2libGVTZXF1ZW5jZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNjcm9sbFRvT2Zmc2V0ID0gLXNjcm9sbFRvT2Zmc2V0O1xuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxUb09mZnNldCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2Nyb2xsVG9PZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuRU5TVVJFVklTSUJMRTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNjcm9sbFRvT2Zmc2V0ICsgZm91bmROb2RlLnNjcm9sbExlbmd0aCA+IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSBzaXplW3RoaXMuX2RpcmVjdGlvbl0gLSAoc2Nyb2xsVG9PZmZzZXQgKyBmb3VuZE5vZGUuc2Nyb2xsTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5FTlNVUkVWSVNJQkxFO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5lbnN1cmVWaXNpYmxlU2VxdWVuY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2Nyb2xsVG9PZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLkdPVE9TRVFVRU5DRTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLl9zY3JvbGwuc2Nyb2xsVG9EaXJlY3Rpb24pIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2Nyb2xsT2Zmc2V0IC0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLkdPVE9QUkVWRElSRUNUSU9OO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHNjcm9sbE9mZnNldCArIHNpemVbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5HT1RPTkVYVERJUkVDVElPTjtcbiAgICB9XG59XG5mdW5jdGlvbiBfc25hcFRvUGFnZShzaXplLCBzY3JvbGxPZmZzZXQpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5wYWdpbmF0ZWQgfHwgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQgfHwgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcGFnZU9mZnNldCA9IHNjcm9sbE9mZnNldDtcbiAgICB2YXIgcGFnZUxlbmd0aDtcbiAgICB2YXIgaGFzTmV4dDtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX25vZGVzLmdldFN0YXJ0RW51bU5vZGUoZmFsc2UpO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLnNjcm9sbExlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgaWYgKHBhZ2VPZmZzZXQgPD0gMCB8fCBub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBoYXNOZXh0ID0gcGFnZUxlbmd0aCAhPT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgcGFnZUxlbmd0aCA9IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgcGFnZU9mZnNldCAtPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fcHJldjtcbiAgICB9XG4gICAgaWYgKHBhZ2VMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSh0cnVlKTtcbiAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlLnNjcm9sbExlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBoYXNOZXh0ID0gcGFnZUxlbmd0aCAhPT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGlmIChoYXNOZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYWdlT2Zmc2V0ICsgcGFnZUxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHBhZ2VPZmZzZXQgKz0gcGFnZUxlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFnZUxlbmd0aCA9IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFwYWdlTGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGZsaXBUb1ByZXY7XG4gICAgdmFyIGZsaXBUb05leHQ7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uRW5lcmd5VGhyZXNzaG9sZCAmJiBNYXRoLmFicyh0aGlzLl9zY3JvbGwucGFydGljbGUuZ2V0RW5lcmd5KCkpID49IHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uRW5lcmd5VGhyZXNzaG9sZCkge1xuICAgICAgICB2YXIgdmVsb2NpdHkgPSB0aGlzLl9zY3JvbGwucGFydGljbGUuZ2V0VmVsb2NpdHkxRCgpO1xuICAgICAgICBmbGlwVG9QcmV2ID0gdmVsb2NpdHkgPiAwO1xuICAgICAgICBmbGlwVG9OZXh0ID0gdmVsb2NpdHkgPCAwO1xuICAgIH1cbiAgICB2YXIgYm91bmRPZmZzZXQgPSBwYWdlT2Zmc2V0O1xuICAgIHZhciBzbmFwU3ByaW5nUG9zaXRpb247XG4gICAgaWYgKCFoYXNOZXh0IHx8IGZsaXBUb1ByZXYgfHwgIWZsaXBUb05leHQgJiYgTWF0aC5hYnMoYm91bmRPZmZzZXQpIDwgTWF0aC5hYnMoYm91bmRPZmZzZXQgKyBwYWdlTGVuZ3RoKSkge1xuICAgICAgICBzbmFwU3ByaW5nUG9zaXRpb24gPSBzY3JvbGxPZmZzZXQgLSBwYWdlT2Zmc2V0IC0gKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPyBwYWdlTGVuZ3RoIDogMCk7XG4gICAgICAgIGlmIChzbmFwU3ByaW5nUG9zaXRpb24gIT09IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc25hcFNwcmluZ1Bvc2l0aW9uO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5TTkFQUFJFVjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHNuYXBTcHJpbmdQb3NpdGlvbiA9IHNjcm9sbE9mZnNldCAtIChwYWdlT2Zmc2V0ICsgcGFnZUxlbmd0aCk7XG4gICAgICAgIGlmIChzbmFwU3ByaW5nUG9zaXRpb24gIT09IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc25hcFNwcmluZ1Bvc2l0aW9uO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5TTkFQTkVYVDtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIF9ub3JtYWxpemVQcmV2Vmlld1NlcXVlbmNlKHNpemUsIHNjcm9sbE9mZnNldCkge1xuICAgIHZhciBjb3VudCA9IDA7XG4gICAgdmFyIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQ7XG4gICAgdmFyIG5vcm1hbGl6ZU5leHRQcmV2ID0gZmFsc2U7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKGZhbHNlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkIHx8ICFub2RlLl92aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub3JtYWxpemVOZXh0UHJldikge1xuICAgICAgICAgICAgdGhpcy5fdmlld1NlcXVlbmNlID0gbm9kZS5fdmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IHNjcm9sbE9mZnNldDtcbiAgICAgICAgICAgIG5vcm1hbGl6ZU5leHRQcmV2ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuc2Nyb2xsTGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbm9kZS50cnVlU2l6ZVJlcXVlc3RlZCB8fCBzY3JvbGxPZmZzZXQgPCAwKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBzY3JvbGxPZmZzZXQgLT0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgIGNvdW50Kys7XG4gICAgICAgIGlmIChub2RlLnNjcm9sbExlbmd0aCkge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICBub3JtYWxpemVOZXh0UHJldiA9IHNjcm9sbE9mZnNldCA+PSAwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSBub2RlLl92aWV3U2VxdWVuY2U7XG4gICAgICAgICAgICAgICAgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IHNjcm9sbE9mZnNldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fcHJldjtcbiAgICB9XG4gICAgcmV0dXJuIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQ7XG59XG5mdW5jdGlvbiBfbm9ybWFsaXplTmV4dFZpZXdTZXF1ZW5jZShzaXplLCBzY3JvbGxPZmZzZXQpIHtcbiAgICB2YXIgY291bnQgPSAwO1xuICAgIHZhciBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0O1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSh0cnVlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkIHx8IG5vZGUuc2Nyb2xsTGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbm9kZS50cnVlU2l6ZVJlcXVlc3RlZCB8fCAhbm9kZS5fdmlld1NlcXVlbmNlIHx8IHNjcm9sbE9mZnNldCA+IDAgJiYgKCF0aGlzLm9wdGlvbnMuYWxpZ25tZW50IHx8IG5vZGUuc2Nyb2xsTGVuZ3RoICE9PSAwKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldCArPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuc2Nyb2xsTGVuZ3RoIHx8IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZpZXdTZXF1ZW5jZSA9IG5vZGUuX3ZpZXdTZXF1ZW5jZTtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICBzY3JvbGxPZmZzZXQgKz0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gbm9ybWFsaXplZFNjcm9sbE9mZnNldDtcbn1cbmZ1bmN0aW9uIF9ub3JtYWxpemVWaWV3U2VxdWVuY2Uoc2l6ZSwgc2Nyb2xsT2Zmc2V0KSB7XG4gICAgdmFyIGNhcHMgPSB0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzO1xuICAgIGlmIChjYXBzICYmIGNhcHMuZGVidWcgJiYgY2Fwcy5kZWJ1Zy5ub3JtYWxpemUgIT09IHVuZGVmaW5lZCAmJiAhY2Fwcy5kZWJ1Zy5ub3JtYWxpemUpIHtcbiAgICAgICAgcmV0dXJuIHNjcm9sbE9mZnNldDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZUNvdW50KSB7XG4gICAgICAgIHJldHVybiBzY3JvbGxPZmZzZXQ7XG4gICAgfVxuICAgIHZhciBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0O1xuICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50ICYmIHNjcm9sbE9mZnNldCA8IDApIHtcbiAgICAgICAgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IF9ub3JtYWxpemVOZXh0Vmlld1NlcXVlbmNlLmNhbGwodGhpcywgc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLm9wdGlvbnMuYWxpZ25tZW50ICYmIHNjcm9sbE9mZnNldCA+IDApIHtcbiAgICAgICAgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IF9ub3JtYWxpemVQcmV2Vmlld1NlcXVlbmNlLmNhbGwodGhpcywgc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICB9XG4gICAgaWYgKG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPT09IHNjcm9sbE9mZnNldCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCAmJiBzY3JvbGxPZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gX25vcm1hbGl6ZVByZXZWaWV3U2VxdWVuY2UuY2FsbCh0aGlzLCBzaXplLCBzY3JvbGxPZmZzZXQpO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLm9wdGlvbnMuYWxpZ25tZW50ICYmIHNjcm9sbE9mZnNldCA8IDApIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBfbm9ybWFsaXplTmV4dFZpZXdTZXF1ZW5jZS5jYWxsKHRoaXMsIHNpemUsIHNjcm9sbE9mZnNldCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgIT09IHNjcm9sbE9mZnNldCkge1xuICAgICAgICB2YXIgZGVsdGEgPSBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0IC0gc2Nyb2xsT2Zmc2V0O1xuICAgICAgICB2YXIgcGFydGljbGVWYWx1ZSA9IHRoaXMuX3Njcm9sbC5wYXJ0aWNsZS5nZXRQb3NpdGlvbjFEKCk7XG4gICAgICAgIF9zZXRQYXJ0aWNsZS5jYWxsKHRoaXMsIHBhcnRpY2xlVmFsdWUgKyBkZWx0YSwgdW5kZWZpbmVkLCAnbm9ybWFsaXplJyk7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uICs9IGRlbHRhO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjYXBzICYmIGNhcHMuc2VxdWVudGlhbFNjcm9sbGluZ09wdGltaXplZCkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmdyb3VwU3RhcnQgLT0gZGVsdGE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQ7XG59XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nZXRWaXNpYmxlSXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNpemUgPSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlO1xuICAgIHZhciBzY3JvbGxPZmZzZXQgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID8gdGhpcy5fc2Nyb2xsLnVubm9ybWFsaXplZFNjcm9sbE9mZnNldCArIHNpemVbdGhpcy5fZGlyZWN0aW9uXSA6IHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQ7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSh0cnVlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkIHx8IG5vZGUuc2Nyb2xsTGVuZ3RoID09PSB1bmRlZmluZWQgfHwgc2Nyb2xsT2Zmc2V0ID4gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBzY3JvbGxPZmZzZXQgKz0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgIGlmIChzY3JvbGxPZmZzZXQgPj0gMCAmJiBub2RlLl92aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgICAgICAgICAgICBpbmRleDogbm9kZS5fdmlld1NlcXVlbmNlLmdldEluZGV4KCksXG4gICAgICAgICAgICAgICAgdmlld1NlcXVlbmNlOiBub2RlLl92aWV3U2VxdWVuY2UsXG4gICAgICAgICAgICAgICAgcmVuZGVyTm9kZTogbm9kZS5yZW5kZXJOb2RlLFxuICAgICAgICAgICAgICAgIHZpc2libGVQZXJjOiBub2RlLnNjcm9sbExlbmd0aCA/IChNYXRoLm1pbihzY3JvbGxPZmZzZXQsIHNpemVbdGhpcy5fZGlyZWN0aW9uXSkgLSBNYXRoLm1heChzY3JvbGxPZmZzZXQgLSBub2RlLnNjcm9sbExlbmd0aCwgMCkpIC8gbm9kZS5zY3JvbGxMZW5ndGggOiAxLFxuICAgICAgICAgICAgICAgIHNjcm9sbE9mZnNldDogc2Nyb2xsT2Zmc2V0IC0gbm9kZS5zY3JvbGxMZW5ndGgsXG4gICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoOiBub2RlLnNjcm9sbExlbmd0aFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgfVxuICAgIHNjcm9sbE9mZnNldCA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPyB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ICsgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dIDogdGhpcy5fc2Nyb2xsLnVubm9ybWFsaXplZFNjcm9sbE9mZnNldDtcbiAgICBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZShmYWxzZSk7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlLl9pbnZhbGlkYXRlZCB8fCBub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IHNjcm9sbE9mZnNldCA8IDApIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHNjcm9sbE9mZnNldCAtPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgaWYgKHNjcm9sbE9mZnNldCA8IHNpemVbdGhpcy5fZGlyZWN0aW9uXSAmJiBub2RlLl92aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0KHtcbiAgICAgICAgICAgICAgICBpbmRleDogbm9kZS5fdmlld1NlcXVlbmNlLmdldEluZGV4KCksXG4gICAgICAgICAgICAgICAgdmlld1NlcXVlbmNlOiBub2RlLl92aWV3U2VxdWVuY2UsXG4gICAgICAgICAgICAgICAgcmVuZGVyTm9kZTogbm9kZS5yZW5kZXJOb2RlLFxuICAgICAgICAgICAgICAgIHZpc2libGVQZXJjOiBub2RlLnNjcm9sbExlbmd0aCA/IChNYXRoLm1pbihzY3JvbGxPZmZzZXQgKyBub2RlLnNjcm9sbExlbmd0aCwgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSAtIE1hdGgubWF4KHNjcm9sbE9mZnNldCwgMCkpIC8gbm9kZS5zY3JvbGxMZW5ndGggOiAxLFxuICAgICAgICAgICAgICAgIHNjcm9sbE9mZnNldDogc2Nyb2xsT2Zmc2V0LFxuICAgICAgICAgICAgICAgIHNjcm9sbExlbmd0aDogbm9kZS5zY3JvbGxMZW5ndGhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9wcmV2O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdldEZpcnN0VmlzaWJsZUl0ZW0gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNpemUgPSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlO1xuICAgIHZhciBzY3JvbGxPZmZzZXQgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID8gdGhpcy5fc2Nyb2xsLnVubm9ybWFsaXplZFNjcm9sbE9mZnNldCArIHNpemVbdGhpcy5fZGlyZWN0aW9uXSA6IHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQ7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKHRydWUpO1xuICAgIHZhciBub2RlRm91bmRWaXNpYmxlUGVyYztcbiAgICB2YXIgbm9kZUZvdW5kU2Nyb2xsT2Zmc2V0O1xuICAgIHZhciBub2RlRm91bmQ7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlLl9pbnZhbGlkYXRlZCB8fCBub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IHNjcm9sbE9mZnNldCA+IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICBpZiAoc2Nyb2xsT2Zmc2V0ID49IDAgJiYgbm9kZS5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICBub2RlRm91bmRWaXNpYmxlUGVyYyA9IG5vZGUuc2Nyb2xsTGVuZ3RoID8gKE1hdGgubWluKHNjcm9sbE9mZnNldCwgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSAtIE1hdGgubWF4KHNjcm9sbE9mZnNldCAtIG5vZGUuc2Nyb2xsTGVuZ3RoLCAwKSkgLyBub2RlLnNjcm9sbExlbmd0aCA6IDE7XG4gICAgICAgICAgICBub2RlRm91bmRTY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQgLSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIGlmIChub2RlRm91bmRWaXNpYmxlUGVyYyA+PSB0aGlzLm9wdGlvbnMudmlzaWJsZUl0ZW1UaHJlc3Nob2xkIHx8IG5vZGVGb3VuZFNjcm9sbE9mZnNldCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgbm9kZUZvdW5kID0gbm9kZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG4gICAgc2Nyb2xsT2Zmc2V0ID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgKyBzaXplW3RoaXMuX2RpcmVjdGlvbl0gOiB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0O1xuICAgIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKGZhbHNlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkIHx8IG5vZGUuc2Nyb2xsTGVuZ3RoID09PSB1bmRlZmluZWQgfHwgc2Nyb2xsT2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc2Nyb2xsT2Zmc2V0IC09IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICBpZiAoc2Nyb2xsT2Zmc2V0IDwgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dICYmIG5vZGUuX3ZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgdmFyIHZpc2libGVQZXJjID0gbm9kZS5zY3JvbGxMZW5ndGggPyAoTWF0aC5taW4oc2Nyb2xsT2Zmc2V0ICsgbm9kZS5zY3JvbGxMZW5ndGgsIHNpemVbdGhpcy5fZGlyZWN0aW9uXSkgLSBNYXRoLm1heChzY3JvbGxPZmZzZXQsIDApKSAvIG5vZGUuc2Nyb2xsTGVuZ3RoIDogMTtcbiAgICAgICAgICAgIGlmICh2aXNpYmxlUGVyYyA+PSB0aGlzLm9wdGlvbnMudmlzaWJsZUl0ZW1UaHJlc3Nob2xkIHx8IHNjcm9sbE9mZnNldCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgbm9kZUZvdW5kVmlzaWJsZVBlcmMgPSB2aXNpYmxlUGVyYztcbiAgICAgICAgICAgICAgICBub2RlRm91bmRTY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQ7XG4gICAgICAgICAgICAgICAgbm9kZUZvdW5kID0gbm9kZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fcHJldjtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGVGb3VuZCA/IHtcbiAgICAgICAgaW5kZXg6IG5vZGVGb3VuZC5fdmlld1NlcXVlbmNlLmdldEluZGV4KCksXG4gICAgICAgIHZpZXdTZXF1ZW5jZTogbm9kZUZvdW5kLl92aWV3U2VxdWVuY2UsXG4gICAgICAgIHJlbmRlck5vZGU6IG5vZGVGb3VuZC5yZW5kZXJOb2RlLFxuICAgICAgICB2aXNpYmxlUGVyYzogbm9kZUZvdW5kVmlzaWJsZVBlcmMsXG4gICAgICAgIHNjcm9sbE9mZnNldDogbm9kZUZvdW5kU2Nyb2xsT2Zmc2V0LFxuICAgICAgICBzY3JvbGxMZW5ndGg6IG5vZGVGb3VuZC5zY3JvbGxMZW5ndGhcbiAgICB9IDogdW5kZWZpbmVkO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdldExhc3RWaXNpYmxlSXRlbSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaXRlbXMgPSB0aGlzLmdldFZpc2libGVJdGVtcygpO1xuICAgIHZhciBzaXplID0gdGhpcy5fY29udGV4dFNpemVDYWNoZTtcbiAgICBmb3IgKHZhciBpID0gaXRlbXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgaWYgKGl0ZW0udmlzaWJsZVBlcmMgPj0gdGhpcy5vcHRpb25zLnZpc2libGVJdGVtVGhyZXNzaG9sZCB8fCBpdGVtLnNjcm9sbE9mZnNldCArIGl0ZW0uc2Nyb2xsTGVuZ3RoIDw9IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGl0ZW1zLmxlbmd0aCA/IGl0ZW1zW2l0ZW1zLmxlbmd0aCAtIDFdIDogdW5kZWZpbmVkO1xufTtcbmZ1bmN0aW9uIF9zY3JvbGxUb1NlcXVlbmNlKHZpZXdTZXF1ZW5jZSwgbmV4dCkge1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxUb1NlcXVlbmNlID0gdmlld1NlcXVlbmNlO1xuICAgIHRoaXMuX3Njcm9sbC5lbnN1cmVWaXNpYmxlU2VxdWVuY2UgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbFRvRGlyZWN0aW9uID0gbmV4dDtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgPSB0cnVlO1xufVxuZnVuY3Rpb24gX2Vuc3VyZVZpc2libGVTZXF1ZW5jZSh2aWV3U2VxdWVuY2UsIG5leHQpIHtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9TZXF1ZW5jZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zY3JvbGwuZW5zdXJlVmlzaWJsZVNlcXVlbmNlID0gdmlld1NlcXVlbmNlO1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxUb0RpcmVjdGlvbiA9IG5leHQ7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbERpcnR5ID0gdHJ1ZTtcbn1cbmZ1bmN0aW9uIF9nb1RvUGFnZShhbW91bnQpIHtcbiAgICB2YXIgdmlld1NlcXVlbmNlID0gdGhpcy5fc2Nyb2xsLnNjcm9sbFRvU2VxdWVuY2UgfHwgdGhpcy5fdmlld1NlcXVlbmNlO1xuICAgIGlmICghdGhpcy5fc2Nyb2xsLnNjcm9sbFRvU2VxdWVuY2UpIHtcbiAgICAgICAgdmFyIGZpcnN0VmlzaWJsZUl0ZW0gPSB0aGlzLmdldEZpcnN0VmlzaWJsZUl0ZW0oKTtcbiAgICAgICAgaWYgKGZpcnN0VmlzaWJsZUl0ZW0pIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IGZpcnN0VmlzaWJsZUl0ZW0udmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgaWYgKGFtb3VudCA8IDAgJiYgZmlyc3RWaXNpYmxlSXRlbS5zY3JvbGxPZmZzZXQgPCAwIHx8IGFtb3VudCA+IDAgJiYgZmlyc3RWaXNpYmxlSXRlbS5zY3JvbGxPZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgYW1vdW50ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXZpZXdTZXF1ZW5jZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTWF0aC5hYnMoYW1vdW50KTsgaSsrKSB7XG4gICAgICAgIHZhciBuZXh0Vmlld1NlcXVlbmNlID0gYW1vdW50ID4gMCA/IHZpZXdTZXF1ZW5jZS5nZXROZXh0KCkgOiB2aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgaWYgKG5leHRWaWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IG5leHRWaWV3U2VxdWVuY2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBfc2Nyb2xsVG9TZXF1ZW5jZS5jYWxsKHRoaXMsIHZpZXdTZXF1ZW5jZSwgYW1vdW50ID49IDApO1xufVxuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ29Ub0ZpcnN0UGFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuX3ZpZXdTZXF1ZW5jZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKHRoaXMuX3ZpZXdTZXF1ZW5jZS5fICYmIHRoaXMuX3ZpZXdTZXF1ZW5jZS5fLmxvb3ApIHtcbiAgICAgICAgTGF5b3V0VXRpbGl0eS5lcnJvcignVW5hYmxlIHRvIGdvIHRvIGZpcnN0IGl0ZW0gb2YgbG9vcGVkIFZpZXdTZXF1ZW5jZScpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdmFyIHZpZXdTZXF1ZW5jZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZTtcbiAgICB3aGlsZSAodmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHZhciBwcmV2ID0gdmlld1NlcXVlbmNlLmdldFByZXZpb3VzKCk7XG4gICAgICAgIGlmIChwcmV2ICYmIHByZXYuZ2V0KCkpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IHByZXY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBfc2Nyb2xsVG9TZXF1ZW5jZS5jYWxsKHRoaXMsIHZpZXdTZXF1ZW5jZSwgZmFsc2UpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdvVG9QcmV2aW91c1BhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgX2dvVG9QYWdlLmNhbGwodGhpcywgLTEpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdvVG9OZXh0UGFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBfZ29Ub1BhZ2UuY2FsbCh0aGlzLCAxKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nb1RvTGFzdFBhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLl92aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmICh0aGlzLl92aWV3U2VxdWVuY2UuXyAmJiB0aGlzLl92aWV3U2VxdWVuY2UuXy5sb29wKSB7XG4gICAgICAgIExheW91dFV0aWxpdHkuZXJyb3IoJ1VuYWJsZSB0byBnbyB0byBsYXN0IGl0ZW0gb2YgbG9vcGVkIFZpZXdTZXF1ZW5jZScpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdmFyIHZpZXdTZXF1ZW5jZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZTtcbiAgICB3aGlsZSAodmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHZhciBuZXh0ID0gdmlld1NlcXVlbmNlLmdldE5leHQoKTtcbiAgICAgICAgaWYgKG5leHQgJiYgbmV4dC5nZXQoKSkge1xuICAgICAgICAgICAgdmlld1NlcXVlbmNlID0gbmV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9zY3JvbGxUb1NlcXVlbmNlLmNhbGwodGhpcywgdmlld1NlcXVlbmNlLCB0cnVlKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nb1RvUmVuZGVyTm9kZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgaWYgKCF0aGlzLl92aWV3U2VxdWVuY2UgfHwgIW5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmICh0aGlzLl92aWV3U2VxdWVuY2UuZ2V0KCkgPT09IG5vZGUpIHtcbiAgICAgICAgdmFyIG5leHQgPSBfY2FsY1Njcm9sbE9mZnNldC5jYWxsKHRoaXMpID49IDA7XG4gICAgICAgIF9zY3JvbGxUb1NlcXVlbmNlLmNhbGwodGhpcywgdGhpcy5fdmlld1NlcXVlbmNlLCBuZXh0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHZhciBuZXh0U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgIHZhciBwcmV2U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICB3aGlsZSAoKG5leHRTZXF1ZW5jZSB8fCBwcmV2U2VxdWVuY2UpICYmIG5leHRTZXF1ZW5jZSAhPT0gdGhpcy5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHZhciBuZXh0Tm9kZSA9IG5leHRTZXF1ZW5jZSA/IG5leHRTZXF1ZW5jZS5nZXQoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKG5leHROb2RlID09PSBub2RlKSB7XG4gICAgICAgICAgICBfc2Nyb2xsVG9TZXF1ZW5jZS5jYWxsKHRoaXMsIG5leHRTZXF1ZW5jZSwgdHJ1ZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHJldk5vZGUgPSBwcmV2U2VxdWVuY2UgPyBwcmV2U2VxdWVuY2UuZ2V0KCkgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChwcmV2Tm9kZSA9PT0gbm9kZSkge1xuICAgICAgICAgICAgX3Njcm9sbFRvU2VxdWVuY2UuY2FsbCh0aGlzLCBwcmV2U2VxdWVuY2UsIGZhbHNlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5leHRTZXF1ZW5jZSA9IG5leHROb2RlID8gbmV4dFNlcXVlbmNlLmdldE5leHQoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgcHJldlNlcXVlbmNlID0gcHJldk5vZGUgPyBwcmV2U2VxdWVuY2UuZ2V0UHJldmlvdXMoKSA6IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZW5zdXJlVmlzaWJsZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBWaWV3U2VxdWVuY2UpIHtcbiAgICAgICAgbm9kZSA9IG5vZGUuZ2V0KCk7XG4gICAgfSBlbHNlIGlmIChub2RlIGluc3RhbmNlb2YgTnVtYmVyIHx8IHR5cGVvZiBub2RlID09PSAnbnVtYmVyJykge1xuICAgICAgICB2YXIgdmlld1NlcXVlbmNlID0gdGhpcy5fdmlld1NlcXVlbmNlO1xuICAgICAgICB3aGlsZSAodmlld1NlcXVlbmNlLmdldEluZGV4KCkgPCBub2RlKSB7XG4gICAgICAgICAgICB2aWV3U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgICAgICAgICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAodmlld1NlcXVlbmNlLmdldEluZGV4KCkgPiBub2RlKSB7XG4gICAgICAgICAgICB2aWV3U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgICAgIGlmICghdmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuX3ZpZXdTZXF1ZW5jZS5nZXQoKSA9PT0gbm9kZSkge1xuICAgICAgICB2YXIgbmV4dCA9IF9jYWxjU2Nyb2xsT2Zmc2V0LmNhbGwodGhpcykgPj0gMDtcbiAgICAgICAgX2Vuc3VyZVZpc2libGVTZXF1ZW5jZS5jYWxsKHRoaXMsIHRoaXMuX3ZpZXdTZXF1ZW5jZSwgbmV4dCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB2YXIgbmV4dFNlcXVlbmNlID0gdGhpcy5fdmlld1NlcXVlbmNlLmdldE5leHQoKTtcbiAgICB2YXIgcHJldlNlcXVlbmNlID0gdGhpcy5fdmlld1NlcXVlbmNlLmdldFByZXZpb3VzKCk7XG4gICAgd2hpbGUgKChuZXh0U2VxdWVuY2UgfHwgcHJldlNlcXVlbmNlKSAmJiBuZXh0U2VxdWVuY2UgIT09IHRoaXMuX3ZpZXdTZXF1ZW5jZSkge1xuICAgICAgICB2YXIgbmV4dE5vZGUgPSBuZXh0U2VxdWVuY2UgPyBuZXh0U2VxdWVuY2UuZ2V0KCkgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChuZXh0Tm9kZSA9PT0gbm9kZSkge1xuICAgICAgICAgICAgX2Vuc3VyZVZpc2libGVTZXF1ZW5jZS5jYWxsKHRoaXMsIG5leHRTZXF1ZW5jZSwgdHJ1ZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHJldk5vZGUgPSBwcmV2U2VxdWVuY2UgPyBwcmV2U2VxdWVuY2UuZ2V0KCkgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChwcmV2Tm9kZSA9PT0gbm9kZSkge1xuICAgICAgICAgICAgX2Vuc3VyZVZpc2libGVTZXF1ZW5jZS5jYWxsKHRoaXMsIHByZXZTZXF1ZW5jZSwgZmFsc2UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dFNlcXVlbmNlID0gbmV4dE5vZGUgPyBuZXh0U2VxdWVuY2UuZ2V0TmV4dCgpIDogdW5kZWZpbmVkO1xuICAgICAgICBwcmV2U2VxdWVuY2UgPSBwcmV2Tm9kZSA/IHByZXZTZXF1ZW5jZS5nZXRQcmV2aW91cygpIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5zY3JvbGwgPSBmdW5jdGlvbiAoZGVsdGEpIHtcbiAgICB0aGlzLmhhbHQoKTtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGVsdGEgKz0gZGVsdGE7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuY2FuU2Nyb2xsID0gZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgdmFyIHNjcm9sbE9mZnNldCA9IF9jYWxjU2Nyb2xsT2Zmc2V0LmNhbGwodGhpcyk7XG4gICAgdmFyIHByZXZIZWlnaHQgPSB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KGZhbHNlKTtcbiAgICB2YXIgbmV4dEhlaWdodCA9IHRoaXMuX2NhbGNTY3JvbGxIZWlnaHQodHJ1ZSk7XG4gICAgdmFyIHRvdGFsSGVpZ2h0O1xuICAgIGlmIChuZXh0SGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgcHJldkhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRvdGFsSGVpZ2h0ID0gcHJldkhlaWdodCArIG5leHRIZWlnaHQ7XG4gICAgfVxuICAgIGlmICh0b3RhbEhlaWdodCAhPT0gdW5kZWZpbmVkICYmIHRvdGFsSGVpZ2h0IDw9IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKGRlbHRhIDwgMCAmJiBuZXh0SGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIG5leHRPZmZzZXQgPSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlW3RoaXMuX2RpcmVjdGlvbl0gLSAoc2Nyb2xsT2Zmc2V0ICsgbmV4dEhlaWdodCk7XG4gICAgICAgIHJldHVybiBNYXRoLm1heChuZXh0T2Zmc2V0LCBkZWx0YSk7XG4gICAgfSBlbHNlIGlmIChkZWx0YSA+IDAgJiYgcHJldkhlaWdodCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhciBwcmV2T2Zmc2V0ID0gLShzY3JvbGxPZmZzZXQgLSBwcmV2SGVpZ2h0KTtcbiAgICAgICAgcmV0dXJuIE1hdGgubWluKHByZXZPZmZzZXQsIGRlbHRhKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlbHRhO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmhhbHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbFRvU2VxdWVuY2UgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fc2Nyb2xsLmVuc3VyZVZpc2libGVTZXF1ZW5jZSA9IHVuZGVmaW5lZDtcbiAgICBfc2V0UGFydGljbGUuY2FsbCh0aGlzLCB1bmRlZmluZWQsIDAsICdoYWx0Jyk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuaXNTY3JvbGxpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Njcm9sbC5pc1Njcm9sbGluZztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nZXRCb3VuZHNSZWFjaGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZDtcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nZXRWZWxvY2l0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLmdldFZlbG9jaXR5MUQoKTtcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5zZXRWZWxvY2l0eSA9IGZ1bmN0aW9uICh2ZWxvY2l0eSkge1xuICAgIHJldHVybiB0aGlzLl9zY3JvbGwucGFydGljbGUuc2V0VmVsb2NpdHkxRCh2ZWxvY2l0eSk7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuYXBwbHlTY3JvbGxGb3JjZSA9IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgIHRoaXMuaGFsdCgpO1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZUNvdW50Kys7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlICs9IGRlbHRhO1xuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZVNjcm9sbEZvcmNlID0gZnVuY3Rpb24gKHByZXZEZWx0YSwgbmV3RGVsdGEpIHtcbiAgICB0aGlzLmhhbHQoKTtcbiAgICBuZXdEZWx0YSAtPSBwcmV2RGVsdGE7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlICs9IG5ld0RlbHRhO1xuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnJlbGVhc2VTY3JvbGxGb3JjZSA9IGZ1bmN0aW9uIChkZWx0YSwgdmVsb2NpdHkpIHtcbiAgICB0aGlzLmhhbHQoKTtcbiAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQgPT09IDEpIHtcbiAgICAgICAgdmFyIHNjcm9sbE9mZnNldCA9IF9jYWxjU2Nyb2xsT2Zmc2V0LmNhbGwodGhpcyk7XG4gICAgICAgIF9zZXRQYXJ0aWNsZS5jYWxsKHRoaXMsIHNjcm9sbE9mZnNldCwgdmVsb2NpdHksICdyZWxlYXNlU2Nyb2xsRm9yY2UnKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnBlLndha2UoKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlID0gMDtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNjcm9sbERpcnR5ID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2UgLT0gZGVsdGE7XG4gICAgfVxuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZUNvdW50LS07XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ2V0U3BlYyA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgdmFyIHNwZWMgPSBMYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5nZXRTcGVjLmNhbGwodGhpcywgbm9kZSk7XG4gICAgaWYgKHNwZWMgJiYgdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcyAmJiB0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzLnNlcXVlbnRpYWxTY3JvbGxpbmdPcHRpbWl6ZWQpIHtcbiAgICAgICAgc3BlYyA9IHtcbiAgICAgICAgICAgIG9yaWdpbjogc3BlYy5vcmlnaW4sXG4gICAgICAgICAgICBhbGlnbjogc3BlYy5hbGlnbixcbiAgICAgICAgICAgIG9wYWNpdHk6IHNwZWMub3BhY2l0eSxcbiAgICAgICAgICAgIHNpemU6IHNwZWMuc2l6ZSxcbiAgICAgICAgICAgIHJlbmRlck5vZGU6IHNwZWMucmVuZGVyTm9kZSxcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc3BlYy50cmFuc2Zvcm1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHRyYW5zbGF0ZSA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXTtcbiAgICAgICAgdHJhbnNsYXRlW3RoaXMuX2RpcmVjdGlvbl0gPSB0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZSArIHRoaXMuX3Njcm9sbC5ncm91cFN0YXJ0O1xuICAgICAgICBzcGVjLnRyYW5zZm9ybSA9IFRyYW5zZm9ybS50aGVuTW92ZShzcGVjLnRyYW5zZm9ybSwgdHJhbnNsYXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHNwZWM7XG59O1xuZnVuY3Rpb24gX2xheW91dChzaXplLCBzY3JvbGxPZmZzZXQsIG5lc3RlZCkge1xuICAgIHRoaXMuX2RlYnVnLmxheW91dENvdW50Kys7XG4gICAgdmFyIHNjcm9sbFN0YXJ0ID0gMCAtIE1hdGgubWF4KHRoaXMub3B0aW9ucy5leHRyYUJvdW5kc1NwYWNlWzBdLCAxKTtcbiAgICB2YXIgc2Nyb2xsRW5kID0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dICsgTWF0aC5tYXgodGhpcy5vcHRpb25zLmV4dHJhQm91bmRzU3BhY2VbMV0sIDEpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMubGF5b3V0QWxsKSB7XG4gICAgICAgIHNjcm9sbFN0YXJ0ID0gLTEwMDAwMDA7XG4gICAgICAgIHNjcm9sbEVuZCA9IDEwMDAwMDA7XG4gICAgfVxuICAgIHZhciBsYXlvdXRDb250ZXh0ID0gdGhpcy5fbm9kZXMucHJlcGFyZUZvckxheW91dCh0aGlzLl92aWV3U2VxdWVuY2UsIHRoaXMuX25vZGVzQnlJZCwge1xuICAgICAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogdGhpcy5fZGlyZWN0aW9uLFxuICAgICAgICAgICAgcmV2ZXJzZTogdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldDogdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHNjcm9sbE9mZnNldCArIHNpemVbdGhpcy5fZGlyZWN0aW9uXSA6IHNjcm9sbE9mZnNldCxcbiAgICAgICAgICAgIHNjcm9sbFN0YXJ0OiBzY3JvbGxTdGFydCxcbiAgICAgICAgICAgIHNjcm9sbEVuZDogc2Nyb2xsRW5kXG4gICAgICAgIH0pO1xuICAgIGlmICh0aGlzLl9sYXlvdXQuX2Z1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2xheW91dC5fZnVuY3Rpb24obGF5b3V0Q29udGV4dCwgdGhpcy5fbGF5b3V0Lm9wdGlvbnMpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fcG9zdExheW91dCkge1xuICAgICAgICB0aGlzLl9wb3N0TGF5b3V0KHNpemUsIHNjcm9sbE9mZnNldCk7XG4gICAgfVxuICAgIHRoaXMuX25vZGVzLnJlbW92ZU5vbkludmFsaWRhdGVkTm9kZXModGhpcy5vcHRpb25zLnJlbW92ZVNwZWMpO1xuICAgIF9jYWxjQm91bmRzLmNhbGwodGhpcywgc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICBfY2FsY1Njcm9sbFRvT2Zmc2V0LmNhbGwodGhpcywgc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICBfc25hcFRvUGFnZS5jYWxsKHRoaXMsIHNpemUsIHNjcm9sbE9mZnNldCk7XG4gICAgdmFyIG5ld1Njcm9sbE9mZnNldCA9IF9jYWxjU2Nyb2xsT2Zmc2V0LmNhbGwodGhpcywgdHJ1ZSk7XG4gICAgaWYgKCFuZXN0ZWQgJiYgbmV3U2Nyb2xsT2Zmc2V0ICE9PSBzY3JvbGxPZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIF9sYXlvdXQuY2FsbCh0aGlzLCBzaXplLCBuZXdTY3JvbGxPZmZzZXQsIHRydWUpO1xuICAgIH1cbiAgICB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0O1xuICAgIHNjcm9sbE9mZnNldCA9IF9ub3JtYWxpemVWaWV3U2VxdWVuY2UuY2FsbCh0aGlzLCBzaXplLCBzY3JvbGxPZmZzZXQpO1xuICAgIF91cGRhdGVTcHJpbmcuY2FsbCh0aGlzKTtcbiAgICByZXR1cm4gc2Nyb2xsT2Zmc2V0O1xufVxuZnVuY3Rpb24gX2lubmVyUmVuZGVyKCkge1xuICAgIHZhciBzcGVjcyA9IHRoaXMuX3NwZWNzO1xuICAgIGZvciAodmFyIGkzID0gMCwgajMgPSBzcGVjcy5sZW5ndGg7IGkzIDwgajM7IGkzKyspIHtcbiAgICAgICAgc3BlY3NbaTNdLnRhcmdldCA9IHNwZWNzW2kzXS5yZW5kZXJOb2RlLnJlbmRlcigpO1xuICAgIH1cbiAgICByZXR1cm4gc3BlY3M7XG59XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5jb21taXQgPSBmdW5jdGlvbiBjb21taXQoY29udGV4dCkge1xuICAgIHZhciBzaXplID0gY29udGV4dC5zaXplO1xuICAgIHRoaXMuX2RlYnVnLmNvbW1pdENvdW50Kys7XG4gICAgdmFyIHNjcm9sbE9mZnNldCA9IF9jYWxjU2Nyb2xsT2Zmc2V0LmNhbGwodGhpcywgdHJ1ZSwgdHJ1ZSk7XG4gICAgaWYgKHRoaXMuX3Njcm9sbE9mZnNldENhY2hlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGUgPSBzY3JvbGxPZmZzZXQ7XG4gICAgfVxuICAgIHZhciBlbWl0RW5kU2Nyb2xsaW5nRXZlbnQgPSBmYWxzZTtcbiAgICB2YXIgZW1pdFNjcm9sbEV2ZW50ID0gZmFsc2U7XG4gICAgdmFyIGV2ZW50RGF0YTtcbiAgICBpZiAoc2l6ZVswXSAhPT0gdGhpcy5fY29udGV4dFNpemVDYWNoZVswXSB8fCBzaXplWzFdICE9PSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzFdIHx8IHRoaXMuX2lzRGlydHkgfHwgdGhpcy5fc2Nyb2xsLnNjcm9sbERpcnR5IHx8IHRoaXMuX25vZGVzLl90cnVlU2l6ZVJlcXVlc3RlZCB8fCB0aGlzLm9wdGlvbnMuYWx3YXlzTGF5b3V0IHx8IHRoaXMuX3Njcm9sbE9mZnNldENhY2hlICE9PSBzY3JvbGxPZmZzZXQpIHtcbiAgICAgICAgZXZlbnREYXRhID0ge1xuICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLFxuICAgICAgICAgICAgb2xkU2l6ZTogdGhpcy5fY29udGV4dFNpemVDYWNoZSxcbiAgICAgICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgICAgICBvbGRTY3JvbGxPZmZzZXQ6IHRoaXMuX3Njcm9sbE9mZnNldENhY2hlLFxuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0OiBzY3JvbGxPZmZzZXRcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMuX3Njcm9sbE9mZnNldENhY2hlICE9PSBzY3JvbGxPZmZzZXQpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fc2Nyb2xsLmlzU2Nyb2xsaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmlzU2Nyb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdzY3JvbGxzdGFydCcsIGV2ZW50RGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbWl0U2Nyb2xsRXZlbnQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ2xheW91dHN0YXJ0JywgZXZlbnREYXRhKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5mbG93ICYmICh0aGlzLl9pc0RpcnR5IHx8IHRoaXMub3B0aW9ucy5yZWZsb3dPblJlc2l6ZSAmJiAoc2l6ZVswXSAhPT0gdGhpcy5fY29udGV4dFNpemVDYWNoZVswXSB8fCBzaXplWzFdICE9PSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzFdKSkpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSgpO1xuICAgICAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBub2RlLnJlbGVhc2VMb2NrKCk7XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29udGV4dFNpemVDYWNoZVswXSA9IHNpemVbMF07XG4gICAgICAgIHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMV0gPSBzaXplWzFdO1xuICAgICAgICB0aGlzLl9pc0RpcnR5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxEaXJ0eSA9IGZhbHNlO1xuICAgICAgICBzY3JvbGxPZmZzZXQgPSBfbGF5b3V0LmNhbGwodGhpcywgc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGUgPSBzY3JvbGxPZmZzZXQ7XG4gICAgICAgIGV2ZW50RGF0YS5zY3JvbGxPZmZzZXQgPSB0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZTtcbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgnbGF5b3V0ZW5kJywgZXZlbnREYXRhKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3Njcm9sbC5pc1Njcm9sbGluZyAmJiAhdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQpIHtcbiAgICAgICAgZW1pdEVuZFNjcm9sbGluZ0V2ZW50ID0gdHJ1ZTtcbiAgICB9XG4gICAgdmFyIGdyb3VwVHJhbnNsYXRlID0gdGhpcy5fc2Nyb2xsLmdyb3VwVHJhbnNsYXRlO1xuICAgIGdyb3VwVHJhbnNsYXRlWzBdID0gMDtcbiAgICBncm91cFRyYW5zbGF0ZVsxXSA9IDA7XG4gICAgZ3JvdXBUcmFuc2xhdGVbMl0gPSAwO1xuICAgIGdyb3VwVHJhbnNsYXRlW3RoaXMuX2RpcmVjdGlvbl0gPSAtdGhpcy5fc2Nyb2xsLmdyb3VwU3RhcnQgLSBzY3JvbGxPZmZzZXQ7XG4gICAgdmFyIHNlcXVlbnRpYWxTY3JvbGxpbmdPcHRpbWl6ZWQgPSB0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzID8gdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcy5zZXF1ZW50aWFsU2Nyb2xsaW5nT3B0aW1pemVkIDogZmFsc2U7XG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuX25vZGVzLmJ1aWxkU3BlY0FuZERlc3Ryb3lVbnJlbmRlcmVkTm9kZXMoc2VxdWVudGlhbFNjcm9sbGluZ09wdGltaXplZCA/IGdyb3VwVHJhbnNsYXRlIDogdW5kZWZpbmVkKTtcbiAgICB0aGlzLl9zcGVjcyA9IHJlc3VsdC5zcGVjcztcbiAgICBpZiAocmVzdWx0Lm1vZGlmaWVkKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ3JlZmxvdycsIHsgdGFyZ2V0OiB0aGlzIH0pO1xuICAgIH1cbiAgICBpZiAoZW1pdFNjcm9sbEV2ZW50KSB7XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ3Njcm9sbCcsIGV2ZW50RGF0YSk7XG4gICAgfVxuICAgIGlmIChldmVudERhdGEpIHtcbiAgICAgICAgdmFyIHZpc2libGVJdGVtID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRoaXMuZ2V0TGFzdFZpc2libGVJdGVtKCkgOiB0aGlzLmdldEZpcnN0VmlzaWJsZUl0ZW0oKTtcbiAgICAgICAgaWYgKHZpc2libGVJdGVtICYmICF0aGlzLl92aXNpYmxlSXRlbUNhY2hlIHx8ICF2aXNpYmxlSXRlbSAmJiB0aGlzLl92aXNpYmxlSXRlbUNhY2hlIHx8IHZpc2libGVJdGVtICYmIHRoaXMuX3Zpc2libGVJdGVtQ2FjaGUgJiYgdmlzaWJsZUl0ZW0ucmVuZGVyTm9kZSAhPT0gdGhpcy5fdmlzaWJsZUl0ZW1DYWNoZS5yZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdwYWdlY2hhbmdlJywge1xuICAgICAgICAgICAgICAgIHRhcmdldDogdGhpcyxcbiAgICAgICAgICAgICAgICBvbGRWaWV3U2VxdWVuY2U6IHRoaXMuX3Zpc2libGVJdGVtQ2FjaGUgPyB0aGlzLl92aXNpYmxlSXRlbUNhY2hlLnZpZXdTZXF1ZW5jZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICB2aWV3U2VxdWVuY2U6IHZpc2libGVJdGVtID8gdmlzaWJsZUl0ZW0udmlld1NlcXVlbmNlIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIG9sZEluZGV4OiB0aGlzLl92aXNpYmxlSXRlbUNhY2hlID8gdGhpcy5fdmlzaWJsZUl0ZW1DYWNoZS5pbmRleCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBpbmRleDogdmlzaWJsZUl0ZW0gPyB2aXNpYmxlSXRlbS5pbmRleCA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl92aXNpYmxlSXRlbUNhY2hlID0gdmlzaWJsZUl0ZW07XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGVtaXRFbmRTY3JvbGxpbmdFdmVudCkge1xuICAgICAgICB0aGlzLl9zY3JvbGwuaXNTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgZXZlbnREYXRhID0ge1xuICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLFxuICAgICAgICAgICAgb2xkU2l6ZTogc2l6ZSxcbiAgICAgICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgICAgICBvbGRTY3JvbGxPZmZzZXQ6IHNjcm9sbE9mZnNldCxcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldDogc2Nyb2xsT2Zmc2V0XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ3Njcm9sbGVuZCcsIGV2ZW50RGF0YSk7XG4gICAgfVxuICAgIHZhciB0cmFuc2Zvcm0gPSBjb250ZXh0LnRyYW5zZm9ybTtcbiAgICBpZiAoc2VxdWVudGlhbFNjcm9sbGluZ09wdGltaXplZCkge1xuICAgICAgICB2YXIgd2luZG93T2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0ICsgdGhpcy5fc2Nyb2xsLmdyb3VwU3RhcnQ7XG4gICAgICAgIHZhciB0cmFuc2xhdGUgPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgIHRyYW5zbGF0ZVt0aGlzLl9kaXJlY3Rpb25dID0gd2luZG93T2Zmc2V0O1xuICAgICAgICB0cmFuc2Zvcm0gPSBUcmFuc2Zvcm0udGhlbk1vdmUodHJhbnNmb3JtLCB0cmFuc2xhdGUpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zZm9ybSxcbiAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgb3BhY2l0eTogY29udGV4dC5vcGFjaXR5LFxuICAgICAgICBvcmlnaW46IGNvbnRleHQub3JpZ2luLFxuICAgICAgICB0YXJnZXQ6IHRoaXMuZ3JvdXAucmVuZGVyKClcbiAgICB9O1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICBpZiAodGhpcy5jb250YWluZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLnJlbmRlci5hcHBseSh0aGlzLmNvbnRhaW5lciwgYXJndW1lbnRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5pZDtcbiAgICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBTY3JvbGxDb250cm9sbGVyO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyIExheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuLi9MYXlvdXRVdGlsaXR5Jyk7XG5mdW5jdGlvbiBMYXlvdXREb2NrSGVscGVyKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2l6ZSA9IGNvbnRleHQuc2l6ZTtcbiAgICB0aGlzLl9zaXplID0gc2l6ZTtcbiAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcbiAgICB0aGlzLl9vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLl96ID0gb3B0aW9ucyAmJiBvcHRpb25zLnRyYW5zbGF0ZVogPyBvcHRpb25zLnRyYW5zbGF0ZVogOiAwO1xuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMubWFyZ2lucykge1xuICAgICAgICB2YXIgbWFyZ2lucyA9IExheW91dFV0aWxpdHkubm9ybWFsaXplTWFyZ2lucyhvcHRpb25zLm1hcmdpbnMpO1xuICAgICAgICB0aGlzLl9sZWZ0ID0gbWFyZ2luc1szXTtcbiAgICAgICAgdGhpcy5fdG9wID0gbWFyZ2luc1swXTtcbiAgICAgICAgdGhpcy5fcmlnaHQgPSBzaXplWzBdIC0gbWFyZ2luc1sxXTtcbiAgICAgICAgdGhpcy5fYm90dG9tID0gc2l6ZVsxXSAtIG1hcmdpbnNbMl07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbGVmdCA9IDA7XG4gICAgICAgIHRoaXMuX3RvcCA9IDA7XG4gICAgICAgIHRoaXMuX3JpZ2h0ID0gc2l6ZVswXTtcbiAgICAgICAgdGhpcy5fYm90dG9tID0gc2l6ZVsxXTtcbiAgICB9XG59XG5MYXlvdXREb2NrSGVscGVyLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBydWxlID0gZGF0YVtpXTtcbiAgICAgICAgdmFyIHZhbHVlID0gcnVsZS5sZW5ndGggPj0gMyA/IHJ1bGVbMl0gOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChydWxlWzBdID09PSAndG9wJykge1xuICAgICAgICAgICAgdGhpcy50b3AocnVsZVsxXSwgdmFsdWUsIHJ1bGUubGVuZ3RoID49IDQgPyBydWxlWzNdIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfSBlbHNlIGlmIChydWxlWzBdID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIHRoaXMubGVmdChydWxlWzFdLCB2YWx1ZSwgcnVsZS5sZW5ndGggPj0gNCA/IHJ1bGVbM10gOiB1bmRlZmluZWQpO1xuICAgICAgICB9IGVsc2UgaWYgKHJ1bGVbMF0gPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIHRoaXMucmlnaHQocnVsZVsxXSwgdmFsdWUsIHJ1bGUubGVuZ3RoID49IDQgPyBydWxlWzNdIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfSBlbHNlIGlmIChydWxlWzBdID09PSAnYm90dG9tJykge1xuICAgICAgICAgICAgdGhpcy5ib3R0b20ocnVsZVsxXSwgdmFsdWUsIHJ1bGUubGVuZ3RoID49IDQgPyBydWxlWzNdIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfSBlbHNlIGlmIChydWxlWzBdID09PSAnZmlsbCcpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsbChydWxlWzFdLCBydWxlLmxlbmd0aCA+PSAzID8gcnVsZVsyXSA6IHVuZGVmaW5lZCk7XG4gICAgICAgIH0gZWxzZSBpZiAocnVsZVswXSA9PT0gJ21hcmdpbnMnKSB7XG4gICAgICAgICAgICB0aGlzLm1hcmdpbnMocnVsZVsxXSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuTGF5b3V0RG9ja0hlbHBlci5wcm90b3R5cGUudG9wID0gZnVuY3Rpb24gKG5vZGUsIGhlaWdodCwgeikge1xuICAgIGlmIChoZWlnaHQgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBoZWlnaHQgPSBoZWlnaHRbMV07XG4gICAgfVxuICAgIGlmIChoZWlnaHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgc2l6ZSA9IHRoaXMuX2NvbnRleHQucmVzb2x2ZVNpemUobm9kZSwgW1xuICAgICAgICAgICAgICAgIHRoaXMuX3JpZ2h0IC0gdGhpcy5fbGVmdCxcbiAgICAgICAgICAgICAgICB0aGlzLl9ib3R0b20gLSB0aGlzLl90b3BcbiAgICAgICAgICAgIF0pO1xuICAgICAgICBoZWlnaHQgPSBzaXplWzFdO1xuICAgIH1cbiAgICB0aGlzLl9jb250ZXh0LnNldChub2RlLCB7XG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIHRoaXMuX3JpZ2h0IC0gdGhpcy5fbGVmdCxcbiAgICAgICAgICAgIGhlaWdodFxuICAgICAgICBdLFxuICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICB0aGlzLl90b3AsXG4gICAgICAgICAgICB6ID09PSB1bmRlZmluZWQgPyB0aGlzLl96IDogelxuICAgICAgICBdXG4gICAgfSk7XG4gICAgdGhpcy5fdG9wICs9IGhlaWdodDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXREb2NrSGVscGVyLnByb3RvdHlwZS5sZWZ0ID0gZnVuY3Rpb24gKG5vZGUsIHdpZHRoLCB6KSB7XG4gICAgaWYgKHdpZHRoIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgd2lkdGggPSB3aWR0aFswXTtcbiAgICB9XG4gICAgaWYgKHdpZHRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIHNpemUgPSB0aGlzLl9jb250ZXh0LnJlc29sdmVTaXplKG5vZGUsIFtcbiAgICAgICAgICAgICAgICB0aGlzLl9yaWdodCAtIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICAgICAgdGhpcy5fYm90dG9tIC0gdGhpcy5fdG9wXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgd2lkdGggPSBzaXplWzBdO1xuICAgIH1cbiAgICB0aGlzLl9jb250ZXh0LnNldChub2RlLCB7XG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgdGhpcy5fYm90dG9tIC0gdGhpcy5fdG9wXG4gICAgICAgIF0sXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgYWxpZ246IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgdGhpcy5fbGVmdCxcbiAgICAgICAgICAgIHRoaXMuX3RvcCxcbiAgICAgICAgICAgIHogPT09IHVuZGVmaW5lZCA/IHRoaXMuX3ogOiB6XG4gICAgICAgIF1cbiAgICB9KTtcbiAgICB0aGlzLl9sZWZ0ICs9IHdpZHRoO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dERvY2tIZWxwZXIucHJvdG90eXBlLmJvdHRvbSA9IGZ1bmN0aW9uIChub2RlLCBoZWlnaHQsIHopIHtcbiAgICBpZiAoaGVpZ2h0IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgaGVpZ2h0ID0gaGVpZ2h0WzFdO1xuICAgIH1cbiAgICBpZiAoaGVpZ2h0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIHNpemUgPSB0aGlzLl9jb250ZXh0LnJlc29sdmVTaXplKG5vZGUsIFtcbiAgICAgICAgICAgICAgICB0aGlzLl9yaWdodCAtIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICAgICAgdGhpcy5fYm90dG9tIC0gdGhpcy5fdG9wXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgaGVpZ2h0ID0gc2l6ZVsxXTtcbiAgICB9XG4gICAgdGhpcy5fY29udGV4dC5zZXQobm9kZSwge1xuICAgICAgICBzaXplOiBbXG4gICAgICAgICAgICB0aGlzLl9yaWdodCAtIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICBoZWlnaHRcbiAgICAgICAgXSxcbiAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMVxuICAgICAgICBdLFxuICAgICAgICBhbGlnbjogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDFcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICB0aGlzLl9sZWZ0LFxuICAgICAgICAgICAgLSh0aGlzLl9zaXplWzFdIC0gdGhpcy5fYm90dG9tKSxcbiAgICAgICAgICAgIHogPT09IHVuZGVmaW5lZCA/IHRoaXMuX3ogOiB6XG4gICAgICAgIF1cbiAgICB9KTtcbiAgICB0aGlzLl9ib3R0b20gLT0gaGVpZ2h0O1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dERvY2tIZWxwZXIucHJvdG90eXBlLnJpZ2h0ID0gZnVuY3Rpb24gKG5vZGUsIHdpZHRoLCB6KSB7XG4gICAgaWYgKHdpZHRoIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgd2lkdGggPSB3aWR0aFswXTtcbiAgICB9XG4gICAgaWYgKG5vZGUpIHtcbiAgICAgICAgaWYgKHdpZHRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZhciBzaXplID0gdGhpcy5fY29udGV4dC5yZXNvbHZlU2l6ZShub2RlLCBbXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3JpZ2h0IC0gdGhpcy5fbGVmdCxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYm90dG9tIC0gdGhpcy5fdG9wXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICB3aWR0aCA9IHNpemVbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29udGV4dC5zZXQobm9kZSwge1xuICAgICAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgICAgIHRoaXMuX2JvdHRvbSAtIHRoaXMuX3RvcFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAgICAgLSh0aGlzLl9zaXplWzBdIC0gdGhpcy5fcmlnaHQpLFxuICAgICAgICAgICAgICAgIHRoaXMuX3RvcCxcbiAgICAgICAgICAgICAgICB6ID09PSB1bmRlZmluZWQgPyB0aGlzLl96IDogelxuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHdpZHRoKSB7XG4gICAgICAgIHRoaXMuX3JpZ2h0IC09IHdpZHRoO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXREb2NrSGVscGVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gKG5vZGUsIHopIHtcbiAgICB0aGlzLl9jb250ZXh0LnNldChub2RlLCB7XG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIHRoaXMuX3JpZ2h0IC0gdGhpcy5fbGVmdCxcbiAgICAgICAgICAgIHRoaXMuX2JvdHRvbSAtIHRoaXMuX3RvcFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICB0aGlzLl90b3AsXG4gICAgICAgICAgICB6ID09PSB1bmRlZmluZWQgPyB0aGlzLl96IDogelxuICAgICAgICBdXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0RG9ja0hlbHBlci5wcm90b3R5cGUubWFyZ2lucyA9IGZ1bmN0aW9uIChtYXJnaW5zKSB7XG4gICAgbWFyZ2lucyA9IExheW91dFV0aWxpdHkubm9ybWFsaXplTWFyZ2lucyhtYXJnaW5zKTtcbiAgICB0aGlzLl9sZWZ0ICs9IG1hcmdpbnNbM107XG4gICAgdGhpcy5fdG9wICs9IG1hcmdpbnNbMF07XG4gICAgdGhpcy5fcmlnaHQgLT0gbWFyZ2luc1sxXTtcbiAgICB0aGlzLl9ib3R0b20gLT0gbWFyZ2luc1syXTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXRVdGlsaXR5LnJlZ2lzdGVySGVscGVyKCdkb2NrJywgTGF5b3V0RG9ja0hlbHBlcik7XG5tb2R1bGUuZXhwb3J0cyA9IExheW91dERvY2tIZWxwZXI7IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIFV0aWxpdHkgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiBudWxsO1xudmFyIExheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgY2FwYWJpbGl0aWVzID0ge1xuICAgICAgICBzZXF1ZW5jZTogdHJ1ZSxcbiAgICAgICAgZGlyZWN0aW9uOiBbXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5ZLFxuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWFxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxpbmc6IHRydWUsXG4gICAgICAgIHRydWVTaXplOiB0cnVlLFxuICAgICAgICBzZXF1ZW50aWFsU2Nyb2xsaW5nT3B0aW1pemVkOiB0cnVlXG4gICAgfTtcbnZhciBjb250ZXh0O1xudmFyIHNpemU7XG52YXIgZGlyZWN0aW9uO1xudmFyIGFsaWdubWVudDtcbnZhciBsaW5lRGlyZWN0aW9uO1xudmFyIGxpbmVMZW5ndGg7XG52YXIgb2Zmc2V0O1xudmFyIG1hcmdpbnM7XG52YXIgbWFyZ2luID0gW1xuICAgICAgICAwLFxuICAgICAgICAwXG4gICAgXTtcbnZhciBzcGFjaW5nO1xudmFyIGp1c3RpZnk7XG52YXIgaXRlbVNpemU7XG52YXIgZ2V0SXRlbVNpemU7XG52YXIgbGluZU5vZGVzO1xuZnVuY3Rpb24gX2xheW91dExpbmUobmV4dCwgZW5kUmVhY2hlZCkge1xuICAgIGlmICghbGluZU5vZGVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIGk7XG4gICAgdmFyIGxpbmVTaXplID0gW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICB2YXIgbGluZU5vZGU7XG4gICAgZm9yIChpID0gMDsgaSA8IGxpbmVOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsaW5lU2l6ZVtkaXJlY3Rpb25dID0gTWF0aC5tYXgobGluZVNpemVbZGlyZWN0aW9uXSwgbGluZU5vZGVzW2ldLnNpemVbZGlyZWN0aW9uXSk7XG4gICAgICAgIGxpbmVTaXplW2xpbmVEaXJlY3Rpb25dICs9IChpID4gMCA/IHNwYWNpbmdbbGluZURpcmVjdGlvbl0gOiAwKSArIGxpbmVOb2Rlc1tpXS5zaXplW2xpbmVEaXJlY3Rpb25dO1xuICAgIH1cbiAgICB2YXIganVzdGlmeU9mZnNldCA9IGp1c3RpZnlbbGluZURpcmVjdGlvbl0gPyAobGluZUxlbmd0aCAtIGxpbmVTaXplW2xpbmVEaXJlY3Rpb25dKSAvIChsaW5lTm9kZXMubGVuZ3RoICogMikgOiAwO1xuICAgIHZhciBsaW5lT2Zmc2V0ID0gKGRpcmVjdGlvbiA/IG1hcmdpbnNbM10gOiBtYXJnaW5zWzBdKSArIGp1c3RpZnlPZmZzZXQ7XG4gICAgdmFyIHNjcm9sbExlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGluZU5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpbmVOb2RlID0gbGluZU5vZGVzW2ldO1xuICAgICAgICB2YXIgdHJhbnNsYXRlID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB0cmFuc2xhdGVbbGluZURpcmVjdGlvbl0gPSBsaW5lT2Zmc2V0O1xuICAgICAgICB0cmFuc2xhdGVbZGlyZWN0aW9uXSA9IG5leHQgPyBvZmZzZXQgOiBvZmZzZXQgLSBsaW5lU2l6ZVtkaXJlY3Rpb25dO1xuICAgICAgICBzY3JvbGxMZW5ndGggPSAwO1xuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoID0gbGluZVNpemVbZGlyZWN0aW9uXTtcbiAgICAgICAgICAgIGlmIChlbmRSZWFjaGVkICYmIChuZXh0ICYmICFhbGlnbm1lbnQgfHwgIW5leHQgJiYgYWxpZ25tZW50KSkge1xuICAgICAgICAgICAgICAgIHNjcm9sbExlbmd0aCArPSBkaXJlY3Rpb24gPyBtYXJnaW5zWzBdICsgbWFyZ2luc1syXSA6IG1hcmdpbnNbM10gKyBtYXJnaW5zWzFdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxMZW5ndGggKz0gc3BhY2luZ1tkaXJlY3Rpb25dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxpbmVOb2RlLnNldCA9IHtcbiAgICAgICAgICAgIHNpemU6IGxpbmVOb2RlLnNpemUsXG4gICAgICAgICAgICB0cmFuc2xhdGU6IHRyYW5zbGF0ZSxcbiAgICAgICAgICAgIHNjcm9sbExlbmd0aDogc2Nyb2xsTGVuZ3RoXG4gICAgICAgIH07XG4gICAgICAgIGxpbmVPZmZzZXQgKz0gbGluZU5vZGUuc2l6ZVtsaW5lRGlyZWN0aW9uXSArIHNwYWNpbmdbbGluZURpcmVjdGlvbl0gKyBqdXN0aWZ5T2Zmc2V0ICogMjtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGxpbmVOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsaW5lTm9kZSA9IG5leHQgPyBsaW5lTm9kZXNbaV0gOiBsaW5lTm9kZXNbbGluZU5vZGVzLmxlbmd0aCAtIDEgLSBpXTtcbiAgICAgICAgY29udGV4dC5zZXQobGluZU5vZGUubm9kZSwgbGluZU5vZGUuc2V0KTtcbiAgICB9XG4gICAgbGluZU5vZGVzID0gW107XG4gICAgcmV0dXJuIGxpbmVTaXplW2RpcmVjdGlvbl0gKyBzcGFjaW5nW2RpcmVjdGlvbl07XG59XG5mdW5jdGlvbiBfcmVzb2x2ZU5vZGVTaXplKG5vZGUpIHtcbiAgICB2YXIgbG9jYWxJdGVtU2l6ZSA9IGl0ZW1TaXplO1xuICAgIGlmIChnZXRJdGVtU2l6ZSkge1xuICAgICAgICBsb2NhbEl0ZW1TaXplID0gZ2V0SXRlbVNpemUobm9kZS5yZW5kZXJOb2RlLCBzaXplKTtcbiAgICB9XG4gICAgaWYgKGxvY2FsSXRlbVNpemVbMF0gPT09IHRydWUgfHwgbG9jYWxJdGVtU2l6ZVsxXSA9PT0gdHJ1ZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gY29udGV4dC5yZXNvbHZlU2l6ZShub2RlLCBzaXplKTtcbiAgICAgICAgaWYgKGxvY2FsSXRlbVNpemVbMF0gIT09IHRydWUpIHtcbiAgICAgICAgICAgIHJlc3VsdFswXSA9IGl0ZW1TaXplWzBdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb2NhbEl0ZW1TaXplWzFdICE9PSB0cnVlKSB7XG4gICAgICAgICAgICByZXN1bHRbMV0gPSBpdGVtU2l6ZVsxXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBsb2NhbEl0ZW1TaXplO1xuICAgIH1cbn1cbmZ1bmN0aW9uIENvbGxlY3Rpb25MYXlvdXQoY29udGV4dF8sIG9wdGlvbnMpIHtcbiAgICBjb250ZXh0ID0gY29udGV4dF87XG4gICAgc2l6ZSA9IGNvbnRleHQuc2l6ZTtcbiAgICBkaXJlY3Rpb24gPSBjb250ZXh0LmRpcmVjdGlvbjtcbiAgICBhbGlnbm1lbnQgPSBjb250ZXh0LmFsaWdubWVudDtcbiAgICBsaW5lRGlyZWN0aW9uID0gKGRpcmVjdGlvbiArIDEpICUgMjtcbiAgICBpZiAob3B0aW9ucy5ndXR0ZXIgIT09IHVuZGVmaW5lZCAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdndXR0ZXIgaGFzIGJlZW4gZGVwcmVjYXRlZCBmb3IgQ29sbGVjdGlvbkxheW91dCwgdXNlIG1hcmdpbnMgJiBzcGFjaW5nIGluc3RlYWQnKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuZ3V0dGVyICYmICFvcHRpb25zLm1hcmdpbnMgJiYgIW9wdGlvbnMuc3BhY2luZykge1xuICAgICAgICB2YXIgZ3V0dGVyID0gQXJyYXkuaXNBcnJheShvcHRpb25zLmd1dHRlcikgPyBvcHRpb25zLmd1dHRlciA6IFtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmd1dHRlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zLmd1dHRlclxuICAgICAgICAgICAgXTtcbiAgICAgICAgbWFyZ2lucyA9IFtcbiAgICAgICAgICAgIGd1dHRlclsxXSxcbiAgICAgICAgICAgIGd1dHRlclswXSxcbiAgICAgICAgICAgIGd1dHRlclsxXSxcbiAgICAgICAgICAgIGd1dHRlclswXVxuICAgICAgICBdO1xuICAgICAgICBzcGFjaW5nID0gZ3V0dGVyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG1hcmdpbnMgPSBMYXlvdXRVdGlsaXR5Lm5vcm1hbGl6ZU1hcmdpbnMob3B0aW9ucy5tYXJnaW5zKTtcbiAgICAgICAgc3BhY2luZyA9IG9wdGlvbnMuc3BhY2luZyB8fCAwO1xuICAgICAgICBzcGFjaW5nID0gQXJyYXkuaXNBcnJheShzcGFjaW5nKSA/IHNwYWNpbmcgOiBbXG4gICAgICAgICAgICBzcGFjaW5nLFxuICAgICAgICAgICAgc3BhY2luZ1xuICAgICAgICBdO1xuICAgIH1cbiAgICBtYXJnaW5bMF0gPSBtYXJnaW5zW2RpcmVjdGlvbiA/IDAgOiAzXTtcbiAgICBtYXJnaW5bMV0gPSAtbWFyZ2luc1tkaXJlY3Rpb24gPyAyIDogMV07XG4gICAganVzdGlmeSA9IEFycmF5LmlzQXJyYXkob3B0aW9ucy5qdXN0aWZ5KSA/IG9wdGlvbnMuanVzdGlmeSA6IG9wdGlvbnMuanVzdGlmeSA/IFtcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgdHJ1ZVxuICAgIF0gOiBbXG4gICAgICAgIGZhbHNlLFxuICAgICAgICBmYWxzZVxuICAgIF07XG4gICAgbGluZUxlbmd0aCA9IHNpemVbbGluZURpcmVjdGlvbl0gLSAoZGlyZWN0aW9uID8gbWFyZ2luc1szXSArIG1hcmdpbnNbMV0gOiBtYXJnaW5zWzBdICsgbWFyZ2luc1syXSk7XG4gICAgdmFyIG5vZGU7XG4gICAgdmFyIG5vZGVTaXplO1xuICAgIHZhciBsaW5lT2Zmc2V0O1xuICAgIHZhciBib3VuZDtcbiAgICBpZiAoIW9wdGlvbnMuaXRlbVNpemUpIHtcbiAgICAgICAgaXRlbVNpemUgPSBbXG4gICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgdHJ1ZVxuICAgICAgICBdO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5pdGVtU2l6ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIGdldEl0ZW1TaXplID0gb3B0aW9ucy5pdGVtU2l6ZTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuaXRlbVNpemVbMF0gPT09IHVuZGVmaW5lZCB8fCBvcHRpb25zLml0ZW1TaXplWzBdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaXRlbVNpemUgPSBbXG4gICAgICAgICAgICBvcHRpb25zLml0ZW1TaXplWzBdID09PSB1bmRlZmluZWQgPyBzaXplWzBdIDogb3B0aW9ucy5pdGVtU2l6ZVswXSxcbiAgICAgICAgICAgIG9wdGlvbnMuaXRlbVNpemVbMV0gPT09IHVuZGVmaW5lZCA/IHNpemVbMV0gOiBvcHRpb25zLml0ZW1TaXplWzFdXG4gICAgICAgIF07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbVNpemUgPSBvcHRpb25zLml0ZW1TaXplO1xuICAgIH1cbiAgICBvZmZzZXQgPSBjb250ZXh0LnNjcm9sbE9mZnNldCArIG1hcmdpblthbGlnbm1lbnRdO1xuICAgIGJvdW5kID0gY29udGV4dC5zY3JvbGxFbmQgKyBtYXJnaW5bYWxpZ25tZW50XTtcbiAgICBsaW5lT2Zmc2V0ID0gMDtcbiAgICBsaW5lTm9kZXMgPSBbXTtcbiAgICB3aGlsZSAob2Zmc2V0IDwgYm91bmQpIHtcbiAgICAgICAgbm9kZSA9IGNvbnRleHQubmV4dCgpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIF9sYXlvdXRMaW5lKHRydWUsIHRydWUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZVNpemUgPSBfcmVzb2x2ZU5vZGVTaXplKG5vZGUpO1xuICAgICAgICBsaW5lT2Zmc2V0ICs9IChsaW5lTm9kZXMubGVuZ3RoID8gc3BhY2luZ1tsaW5lRGlyZWN0aW9uXSA6IDApICsgbm9kZVNpemVbbGluZURpcmVjdGlvbl07XG4gICAgICAgIGlmIChsaW5lT2Zmc2V0ID4gbGluZUxlbmd0aCkge1xuICAgICAgICAgICAgb2Zmc2V0ICs9IF9sYXlvdXRMaW5lKHRydWUsICFub2RlKTtcbiAgICAgICAgICAgIGxpbmVPZmZzZXQgPSBub2RlU2l6ZVtsaW5lRGlyZWN0aW9uXTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lTm9kZXMucHVzaCh7XG4gICAgICAgICAgICBub2RlOiBub2RlLFxuICAgICAgICAgICAgc2l6ZTogbm9kZVNpemVcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIG9mZnNldCA9IGNvbnRleHQuc2Nyb2xsT2Zmc2V0ICsgbWFyZ2luW2FsaWdubWVudF07XG4gICAgYm91bmQgPSBjb250ZXh0LnNjcm9sbFN0YXJ0ICsgbWFyZ2luW2FsaWdubWVudF07XG4gICAgbGluZU9mZnNldCA9IDA7XG4gICAgbGluZU5vZGVzID0gW107XG4gICAgd2hpbGUgKG9mZnNldCA+IGJvdW5kKSB7XG4gICAgICAgIG5vZGUgPSBjb250ZXh0LnByZXYoKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICBfbGF5b3V0TGluZShmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlU2l6ZSA9IF9yZXNvbHZlTm9kZVNpemUobm9kZSk7XG4gICAgICAgIGxpbmVPZmZzZXQgKz0gKGxpbmVOb2Rlcy5sZW5ndGggPyBzcGFjaW5nW2xpbmVEaXJlY3Rpb25dIDogMCkgKyBub2RlU2l6ZVtsaW5lRGlyZWN0aW9uXTtcbiAgICAgICAgaWYgKGxpbmVPZmZzZXQgPiBsaW5lTGVuZ3RoKSB7XG4gICAgICAgICAgICBvZmZzZXQgLT0gX2xheW91dExpbmUoZmFsc2UsICFub2RlKTtcbiAgICAgICAgICAgIGxpbmVPZmZzZXQgPSBub2RlU2l6ZVtsaW5lRGlyZWN0aW9uXTtcbiAgICAgICAgfVxuICAgICAgICBsaW5lTm9kZXMudW5zaGlmdCh7XG4gICAgICAgICAgICBub2RlOiBub2RlLFxuICAgICAgICAgICAgc2l6ZTogbm9kZVNpemVcbiAgICAgICAgfSk7XG4gICAgfVxufVxuQ29sbGVjdGlvbkxheW91dC5DYXBhYmlsaXRpZXMgPSBjYXBhYmlsaXRpZXM7XG5Db2xsZWN0aW9uTGF5b3V0Lk5hbWUgPSAnQ29sbGVjdGlvbkxheW91dCc7XG5Db2xsZWN0aW9uTGF5b3V0LkRlc2NyaXB0aW9uID0gJ011bHRpLWNlbGwgY29sbGVjdGlvbi1sYXlvdXQgd2l0aCBtYXJnaW5zICYgc3BhY2luZyc7XG5tb2R1bGUuZXhwb3J0cyA9IENvbGxlY3Rpb25MYXlvdXQ7XG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgVXRpbGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IG51bGw7XG52YXIgY2FwYWJpbGl0aWVzID0ge1xuICAgICAgICBzZXF1ZW5jZTogdHJ1ZSxcbiAgICAgICAgZGlyZWN0aW9uOiBbXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5YLFxuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWVxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxpbmc6IHRydWVcbiAgICB9O1xuZnVuY3Rpb24gQ292ZXJMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBub2RlID0gY29udGV4dC5uZXh0KCk7XG4gICAgaWYgKCFub2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHNpemUgPSBjb250ZXh0LnNpemU7XG4gICAgdmFyIGRpcmVjdGlvbiA9IGNvbnRleHQuZGlyZWN0aW9uO1xuICAgIHZhciBpdGVtU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgdmFyIG9wYWNpdHlTdGVwID0gMC4yO1xuICAgIHZhciBzY2FsZVN0ZXAgPSAwLjE7XG4gICAgdmFyIHRyYW5zbGF0ZVN0ZXAgPSAzMDtcbiAgICB2YXIgelN0YXJ0ID0gMTAwO1xuICAgIGNvbnRleHQuc2V0KG5vZGUsIHtcbiAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgMC41XG4gICAgICAgIF0sXG4gICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAwLjVcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIHpTdGFydFxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxMZW5ndGg6IGl0ZW1TaXplW2RpcmVjdGlvbl1cbiAgICB9KTtcbiAgICB2YXIgdHJhbnNsYXRlID0gaXRlbVNpemVbMF0gLyAyO1xuICAgIHZhciBvcGFjaXR5ID0gMSAtIG9wYWNpdHlTdGVwO1xuICAgIHZhciB6SW5kZXggPSB6U3RhcnQgLSAxO1xuICAgIHZhciBzY2FsZSA9IDEgLSBzY2FsZVN0ZXA7XG4gICAgdmFyIHByZXYgPSBmYWxzZTtcbiAgICB2YXIgZW5kUmVhY2hlZCA9IGZhbHNlO1xuICAgIG5vZGUgPSBjb250ZXh0Lm5leHQoKTtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgbm9kZSA9IGNvbnRleHQucHJldigpO1xuICAgICAgICBwcmV2ID0gdHJ1ZTtcbiAgICB9XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgY29udGV4dC5zZXQobm9kZSwge1xuICAgICAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAgICAgMC41XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgYWxpZ246IFtcbiAgICAgICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAgICAgMC41XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdHJhbnNsYXRlOiBkaXJlY3Rpb24gPyBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICBwcmV2ID8gLXRyYW5zbGF0ZSA6IHRyYW5zbGF0ZSxcbiAgICAgICAgICAgICAgICB6SW5kZXhcbiAgICAgICAgICAgIF0gOiBbXG4gICAgICAgICAgICAgICAgcHJldiA/IC10cmFuc2xhdGUgOiB0cmFuc2xhdGUsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB6SW5kZXhcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBzY2FsZTogW1xuICAgICAgICAgICAgICAgIHNjYWxlLFxuICAgICAgICAgICAgICAgIHNjYWxlLFxuICAgICAgICAgICAgICAgIDFcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBvcGFjaXR5OiBvcGFjaXR5LFxuICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoOiBpdGVtU2l6ZVtkaXJlY3Rpb25dXG4gICAgICAgIH0pO1xuICAgICAgICBvcGFjaXR5IC09IG9wYWNpdHlTdGVwO1xuICAgICAgICBzY2FsZSAtPSBzY2FsZVN0ZXA7XG4gICAgICAgIHRyYW5zbGF0ZSArPSB0cmFuc2xhdGVTdGVwO1xuICAgICAgICB6SW5kZXgtLTtcbiAgICAgICAgaWYgKHRyYW5zbGF0ZSA+PSBzaXplW2RpcmVjdGlvbl0gLyAyKSB7XG4gICAgICAgICAgICBlbmRSZWFjaGVkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUgPSBwcmV2ID8gY29udGV4dC5wcmV2KCkgOiBjb250ZXh0Lm5leHQoKTtcbiAgICAgICAgICAgIGVuZFJlYWNoZWQgPSAhbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW5kUmVhY2hlZCkge1xuICAgICAgICAgICAgaWYgKHByZXYpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVuZFJlYWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHByZXYgPSB0cnVlO1xuICAgICAgICAgICAgbm9kZSA9IGNvbnRleHQucHJldigpO1xuICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGUgPSBpdGVtU2l6ZVtkaXJlY3Rpb25dIC8gMjtcbiAgICAgICAgICAgICAgICBvcGFjaXR5ID0gMSAtIG9wYWNpdHlTdGVwO1xuICAgICAgICAgICAgICAgIHpJbmRleCA9IHpTdGFydCAtIDE7XG4gICAgICAgICAgICAgICAgc2NhbGUgPSAxIC0gc2NhbGVTdGVwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuQ292ZXJMYXlvdXQuQ2FwYWJpbGl0aWVzID0gY2FwYWJpbGl0aWVzO1xubW9kdWxlLmV4cG9ydHMgPSBDb3ZlckxheW91dDtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ3ViZUxheW91dChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGl0ZW1TaXplID0gb3B0aW9ucy5pdGVtU2l6ZTtcbiAgICBjb250ZXh0LnNldChjb250ZXh0Lm5leHQoKSwge1xuICAgICAgICBzaXplOiBpdGVtU2l6ZSxcbiAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAwLjVcbiAgICAgICAgXSxcbiAgICAgICAgcm90YXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgTWF0aC5QSSAvIDIsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgaXRlbVNpemVbMF0gLyAyLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXVxuICAgIH0pO1xuICAgIGNvbnRleHQuc2V0KGNvbnRleHQubmV4dCgpLCB7XG4gICAgICAgIHNpemU6IGl0ZW1TaXplLFxuICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgIDAuNSxcbiAgICAgICAgICAgIDAuNVxuICAgICAgICBdLFxuICAgICAgICByb3RhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICBNYXRoLlBJIC8gMixcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAtKGl0ZW1TaXplWzBdIC8gMiksXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdXG4gICAgfSk7XG4gICAgY29udGV4dC5zZXQoY29udGV4dC5uZXh0KCksIHtcbiAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgMC41XG4gICAgICAgIF0sXG4gICAgICAgIHJvdGF0ZTogW1xuICAgICAgICAgICAgTWF0aC5QSSAvIDIsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAtKGl0ZW1TaXplWzFdIC8gMiksXG4gICAgICAgICAgICAwXG4gICAgICAgIF1cbiAgICB9KTtcbiAgICBjb250ZXh0LnNldChjb250ZXh0Lm5leHQoKSwge1xuICAgICAgICBzaXplOiBpdGVtU2l6ZSxcbiAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAwLjVcbiAgICAgICAgXSxcbiAgICAgICAgcm90YXRlOiBbXG4gICAgICAgICAgICBNYXRoLlBJIC8gMixcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIGl0ZW1TaXplWzFdIC8gMixcbiAgICAgICAgICAgIDBcbiAgICAgICAgXVxuICAgIH0pO1xufTsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgVXRpbGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IG51bGw7XG52YXIgTGF5b3V0VXRpbGl0eSA9IHJlcXVpcmUoJy4uL0xheW91dFV0aWxpdHknKTtcbnZhciBjYXBhYmlsaXRpZXMgPSB7XG4gICAgICAgIHNlcXVlbmNlOiB0cnVlLFxuICAgICAgICBkaXJlY3Rpb246IFtcbiAgICAgICAgICAgIFV0aWxpdHkuRGlyZWN0aW9uLlksXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5YXG4gICAgICAgIF0sXG4gICAgICAgIHNjcm9sbGluZzogZmFsc2VcbiAgICB9O1xuZnVuY3Rpb24gR3JpZExheW91dChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIHNpemUgPSBjb250ZXh0LnNpemU7XG4gICAgaWYgKG9wdGlvbnMuZ3V0dGVyICE9PSB1bmRlZmluZWQgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignZ3V0dGVyIGhhcyBiZWVuIGRlcHJlY2F0ZWQgZm9yIEdyaWRMYXlvdXQsIHVzZSBtYXJnaW5zICYgc3BhY2luZyBpbnN0ZWFkJyk7XG4gICAgfVxuICAgIHZhciBzcGFjaW5nO1xuICAgIGlmIChvcHRpb25zLmd1dHRlciAmJiAhb3B0aW9ucy5zcGFjaW5nKSB7XG4gICAgICAgIHNwYWNpbmcgPSBvcHRpb25zLmd1dHRlciB8fCAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwYWNpbmcgPSBvcHRpb25zLnNwYWNpbmcgfHwgMDtcbiAgICB9XG4gICAgc3BhY2luZyA9IEFycmF5LmlzQXJyYXkoc3BhY2luZykgPyBzcGFjaW5nIDogW1xuICAgICAgICBzcGFjaW5nLFxuICAgICAgICBzcGFjaW5nXG4gICAgXTtcbiAgICB2YXIgbWFyZ2lucyA9IExheW91dFV0aWxpdHkubm9ybWFsaXplTWFyZ2lucyhvcHRpb25zLm1hcmdpbnMpO1xuICAgIHZhciBub2RlU2l6ZSA9IFtcbiAgICAgICAgICAgIChzaXplWzBdIC0gKChvcHRpb25zLmNlbGxzWzBdIC0gMSkgKiBzcGFjaW5nWzBdICsgbWFyZ2luc1sxXSArIG1hcmdpbnNbM10pKSAvIG9wdGlvbnMuY2VsbHNbMF0sXG4gICAgICAgICAgICAoc2l6ZVsxXSAtICgob3B0aW9ucy5jZWxsc1sxXSAtIDEpICogc3BhY2luZ1sxXSArIG1hcmdpbnNbMF0gKyBtYXJnaW5zWzJdKSkgLyBvcHRpb25zLmNlbGxzWzFdXG4gICAgICAgIF07XG4gICAgZnVuY3Rpb24gX2xheW91dE5vZGUobm9kZSwgY29sLCByb3cpIHtcbiAgICAgICAgY29udGV4dC5zZXQobm9kZSwge1xuICAgICAgICAgICAgc2l6ZTogbm9kZVNpemUsXG4gICAgICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgICAgICAobm9kZVNpemVbMF0gKyBzcGFjaW5nWzBdKSAqIGNvbCArIG1hcmdpbnNbM10sXG4gICAgICAgICAgICAgICAgKG5vZGVTaXplWzFdICsgc3BhY2luZ1sxXSkgKiByb3cgKyBtYXJnaW5zWzBdLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHZhciByb3c7XG4gICAgdmFyIGNvbDtcbiAgICB2YXIgbm9kZTtcbiAgICBpZiAoY29udGV4dC5kaXJlY3Rpb24gPT09IFV0aWxpdHkuRGlyZWN0aW9uLlkpIHtcbiAgICAgICAgZm9yIChjb2wgPSAwOyBjb2wgPCBvcHRpb25zLmNlbGxzWzBdOyBjb2wrKykge1xuICAgICAgICAgICAgZm9yIChyb3cgPSAwOyByb3cgPCBvcHRpb25zLmNlbGxzWzFdOyByb3crKykge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBjb250ZXh0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfbGF5b3V0Tm9kZShub2RlLCBjb2wsIHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHJvdyA9IDA7IHJvdyA8IG9wdGlvbnMuY2VsbHNbMV07IHJvdysrKSB7XG4gICAgICAgICAgICBmb3IgKGNvbCA9IDA7IGNvbCA8IG9wdGlvbnMuY2VsbHNbMF07IGNvbCsrKSB7XG4gICAgICAgICAgICAgICAgbm9kZSA9IGNvbnRleHQubmV4dCgpO1xuICAgICAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9sYXlvdXROb2RlKG5vZGUsIGNvbCwgcm93KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbkdyaWRMYXlvdXQuQ2FwYWJpbGl0aWVzID0gY2FwYWJpbGl0aWVzO1xubW9kdWxlLmV4cG9ydHMgPSBHcmlkTGF5b3V0O1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyIExheW91dERvY2tIZWxwZXIgPSByZXF1aXJlKCcuLi9oZWxwZXJzL0xheW91dERvY2tIZWxwZXInKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gSGVhZGVyRm9vdGVyTGF5b3V0KGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICB2YXIgZG9jayA9IG5ldyBMYXlvdXREb2NrSGVscGVyKGNvbnRleHQsIG9wdGlvbnMpO1xuICAgIGRvY2sudG9wKCdoZWFkZXInLCBvcHRpb25zLmhlYWRlclNpemUgfHwgb3B0aW9ucy5oZWFkZXJIZWlnaHQpO1xuICAgIGRvY2suYm90dG9tKCdmb290ZXInLCBvcHRpb25zLmZvb3RlclNpemUgfHwgb3B0aW9ucy5mb290ZXJIZWlnaHQpO1xuICAgIGRvY2suZmlsbCgnY29udGVudCcpO1xufTsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgVXRpbGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IG51bGw7XG52YXIgTGF5b3V0VXRpbGl0eSA9IHJlcXVpcmUoJy4uL0xheW91dFV0aWxpdHknKTtcbnZhciBjYXBhYmlsaXRpZXMgPSB7XG4gICAgICAgIHNlcXVlbmNlOiB0cnVlLFxuICAgICAgICBkaXJlY3Rpb246IFtcbiAgICAgICAgICAgIFV0aWxpdHkuRGlyZWN0aW9uLlksXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5YXG4gICAgICAgIF0sXG4gICAgICAgIHNjcm9sbGluZzogdHJ1ZSxcbiAgICAgICAgdHJ1ZVNpemU6IHRydWUsXG4gICAgICAgIHNlcXVlbnRpYWxTY3JvbGxpbmdPcHRpbWl6ZWQ6IHRydWVcbiAgICB9O1xudmFyIHNldCA9IHtcbiAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgc2Nyb2xsTGVuZ3RoOiB1bmRlZmluZWRcbiAgICB9O1xudmFyIG1hcmdpbiA9IFtcbiAgICAgICAgMCxcbiAgICAgICAgMFxuICAgIF07XG5mdW5jdGlvbiBMaXN0TGF5b3V0KGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2l6ZSA9IGNvbnRleHQuc2l6ZTtcbiAgICB2YXIgZGlyZWN0aW9uID0gY29udGV4dC5kaXJlY3Rpb247XG4gICAgdmFyIGFsaWdubWVudCA9IGNvbnRleHQuYWxpZ25tZW50O1xuICAgIHZhciByZXZEaXJlY3Rpb24gPSBkaXJlY3Rpb24gPyAwIDogMTtcbiAgICB2YXIgb2Zmc2V0O1xuICAgIHZhciBtYXJnaW5zID0gTGF5b3V0VXRpbGl0eS5ub3JtYWxpemVNYXJnaW5zKG9wdGlvbnMubWFyZ2lucyk7XG4gICAgdmFyIHNwYWNpbmcgPSBvcHRpb25zLnNwYWNpbmcgfHwgMDtcbiAgICB2YXIgbm9kZTtcbiAgICB2YXIgbm9kZVNpemU7XG4gICAgdmFyIGl0ZW1TaXplO1xuICAgIHZhciBnZXRJdGVtU2l6ZTtcbiAgICB2YXIgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbDtcbiAgICB2YXIgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbE9mZnNldDtcbiAgICB2YXIgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbExlbmd0aDtcbiAgICB2YXIgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbFNjcm9sbExlbmd0aDtcbiAgICB2YXIgZmlyc3RWaXNpYmxlQ2VsbDtcbiAgICB2YXIgbGFzdE5vZGU7XG4gICAgdmFyIGxhc3RDZWxsT2Zmc2V0SW5GaXJzdFZpc2libGVTZWN0aW9uO1xuICAgIHZhciBpc1NlY3Rpb25DYWxsYmFjayA9IG9wdGlvbnMuaXNTZWN0aW9uQ2FsbGJhY2s7XG4gICAgdmFyIGJvdW5kO1xuICAgIHNldC5zaXplWzBdID0gc2l6ZVswXTtcbiAgICBzZXQuc2l6ZVsxXSA9IHNpemVbMV07XG4gICAgc2V0LnNpemVbcmV2RGlyZWN0aW9uXSAtPSBtYXJnaW5zWzEgLSByZXZEaXJlY3Rpb25dICsgbWFyZ2luc1szIC0gcmV2RGlyZWN0aW9uXTtcbiAgICBzZXQudHJhbnNsYXRlWzBdID0gMDtcbiAgICBzZXQudHJhbnNsYXRlWzFdID0gMDtcbiAgICBzZXQudHJhbnNsYXRlWzJdID0gMDtcbiAgICBzZXQudHJhbnNsYXRlW3JldkRpcmVjdGlvbl0gPSBtYXJnaW5zW2RpcmVjdGlvbiA/IDMgOiAwXTtcbiAgICBpZiAob3B0aW9ucy5pdGVtU2l6ZSA9PT0gdHJ1ZSB8fCAhb3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSgnaXRlbVNpemUnKSkge1xuICAgICAgICBpdGVtU2l6ZSA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLml0ZW1TaXplIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgZ2V0SXRlbVNpemUgPSBvcHRpb25zLml0ZW1TaXplO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW1TaXplID0gb3B0aW9ucy5pdGVtU2l6ZSA9PT0gdW5kZWZpbmVkID8gc2l6ZVtkaXJlY3Rpb25dIDogb3B0aW9ucy5pdGVtU2l6ZTtcbiAgICB9XG4gICAgbWFyZ2luWzBdID0gbWFyZ2luc1tkaXJlY3Rpb24gPyAwIDogM107XG4gICAgbWFyZ2luWzFdID0gLW1hcmdpbnNbZGlyZWN0aW9uID8gMiA6IDFdO1xuICAgIG9mZnNldCA9IGNvbnRleHQuc2Nyb2xsT2Zmc2V0ICsgbWFyZ2luW2FsaWdubWVudF07XG4gICAgYm91bmQgPSBjb250ZXh0LnNjcm9sbEVuZCArIG1hcmdpblthbGlnbm1lbnRdO1xuICAgIHdoaWxlIChvZmZzZXQgPCBib3VuZCkge1xuICAgICAgICBsYXN0Tm9kZSA9IG5vZGU7XG4gICAgICAgIG5vZGUgPSBjb250ZXh0Lm5leHQoKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICBpZiAobGFzdE5vZGUgJiYgIWFsaWdubWVudCkge1xuICAgICAgICAgICAgICAgIHNldC5zY3JvbGxMZW5ndGggPSBub2RlU2l6ZSArIG1hcmdpblswXSArIC1tYXJnaW5bMV07XG4gICAgICAgICAgICAgICAgY29udGV4dC5zZXQobGFzdE5vZGUsIHNldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlU2l6ZSA9IGdldEl0ZW1TaXplID8gZ2V0SXRlbVNpemUobm9kZS5yZW5kZXJOb2RlKSA6IGl0ZW1TaXplO1xuICAgICAgICBub2RlU2l6ZSA9IG5vZGVTaXplID09PSB0cnVlID8gY29udGV4dC5yZXNvbHZlU2l6ZShub2RlLCBzaXplKVtkaXJlY3Rpb25dIDogbm9kZVNpemU7XG4gICAgICAgIHNldC5zaXplW2RpcmVjdGlvbl0gPSBub2RlU2l6ZTtcbiAgICAgICAgc2V0LnRyYW5zbGF0ZVtkaXJlY3Rpb25dID0gb2Zmc2V0ICsgKGFsaWdubWVudCA/IHNwYWNpbmcgOiAwKTtcbiAgICAgICAgc2V0LnNjcm9sbExlbmd0aCA9IG5vZGVTaXplICsgc3BhY2luZztcbiAgICAgICAgY29udGV4dC5zZXQobm9kZSwgc2V0KTtcbiAgICAgICAgb2Zmc2V0ICs9IHNldC5zY3JvbGxMZW5ndGg7XG4gICAgICAgIGlmIChpc1NlY3Rpb25DYWxsYmFjayAmJiBpc1NlY3Rpb25DYWxsYmFjayhub2RlLnJlbmRlck5vZGUpKSB7XG4gICAgICAgICAgICBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0gPSBNYXRoLm1heChtYXJnaW5bMF0sIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSk7XG4gICAgICAgICAgICBjb250ZXh0LnNldChub2RlLCBzZXQpO1xuICAgICAgICAgICAgaWYgKCFmaXJzdFZpc2libGVDZWxsKSB7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCA9IG5vZGU7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbE9mZnNldCA9IG9mZnNldCAtIG5vZGVTaXplO1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxMZW5ndGggPSBub2RlU2l6ZTtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsU2Nyb2xsTGVuZ3RoID0gbm9kZVNpemU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RDZWxsT2Zmc2V0SW5GaXJzdFZpc2libGVTZWN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBsYXN0Q2VsbE9mZnNldEluRmlyc3RWaXNpYmxlU2VjdGlvbiA9IG9mZnNldCAtIG5vZGVTaXplO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCFmaXJzdFZpc2libGVDZWxsICYmIG9mZnNldCA+PSAwKSB7XG4gICAgICAgICAgICBmaXJzdFZpc2libGVDZWxsID0gbm9kZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBub2RlID0gdW5kZWZpbmVkO1xuICAgIG9mZnNldCA9IGNvbnRleHQuc2Nyb2xsT2Zmc2V0ICsgbWFyZ2luW2FsaWdubWVudF07XG4gICAgYm91bmQgPSBjb250ZXh0LnNjcm9sbFN0YXJ0ICsgbWFyZ2luW2FsaWdubWVudF07XG4gICAgd2hpbGUgKG9mZnNldCA+IGJvdW5kKSB7XG4gICAgICAgIGxhc3ROb2RlID0gbm9kZTtcbiAgICAgICAgbm9kZSA9IGNvbnRleHQucHJldigpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIGlmIChsYXN0Tm9kZSAmJiBhbGlnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICBzZXQuc2Nyb2xsTGVuZ3RoID0gbm9kZVNpemUgKyBtYXJnaW5bMF0gKyAtbWFyZ2luWzFdO1xuICAgICAgICAgICAgICAgIGNvbnRleHQuc2V0KGxhc3ROb2RlLCBzZXQpO1xuICAgICAgICAgICAgICAgIGlmIChsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsID09PSBsYXN0Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsU2Nyb2xsTGVuZ3RoID0gc2V0LnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlU2l6ZSA9IGdldEl0ZW1TaXplID8gZ2V0SXRlbVNpemUobm9kZS5yZW5kZXJOb2RlKSA6IGl0ZW1TaXplO1xuICAgICAgICBub2RlU2l6ZSA9IG5vZGVTaXplID09PSB0cnVlID8gY29udGV4dC5yZXNvbHZlU2l6ZShub2RlLCBzaXplKVtkaXJlY3Rpb25dIDogbm9kZVNpemU7XG4gICAgICAgIHNldC5zY3JvbGxMZW5ndGggPSBub2RlU2l6ZSArIHNwYWNpbmc7XG4gICAgICAgIG9mZnNldCAtPSBzZXQuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICBzZXQuc2l6ZVtkaXJlY3Rpb25dID0gbm9kZVNpemU7XG4gICAgICAgIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSA9IG9mZnNldCArIChhbGlnbm1lbnQgPyBzcGFjaW5nIDogMCk7XG4gICAgICAgIGNvbnRleHQuc2V0KG5vZGUsIHNldCk7XG4gICAgICAgIGlmIChpc1NlY3Rpb25DYWxsYmFjayAmJiBpc1NlY3Rpb25DYWxsYmFjayhub2RlLnJlbmRlck5vZGUpKSB7XG4gICAgICAgICAgICBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0gPSBNYXRoLm1heChtYXJnaW5bMF0sIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSk7XG4gICAgICAgICAgICBjb250ZXh0LnNldChub2RlLCBzZXQpO1xuICAgICAgICAgICAgaWYgKCFsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsKSB7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCA9IG5vZGU7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbE9mZnNldCA9IG9mZnNldDtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsTGVuZ3RoID0gbm9kZVNpemU7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbFNjcm9sbExlbmd0aCA9IHNldC5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob2Zmc2V0ICsgbm9kZVNpemUgPj0gMCkge1xuICAgICAgICAgICAgZmlyc3RWaXNpYmxlQ2VsbCA9IG5vZGU7XG4gICAgICAgICAgICBpZiAobGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCkge1xuICAgICAgICAgICAgICAgIGxhc3RDZWxsT2Zmc2V0SW5GaXJzdFZpc2libGVTZWN0aW9uID0gb2Zmc2V0ICsgbm9kZVNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpc1NlY3Rpb25DYWxsYmFjayAmJiAhbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCkge1xuICAgICAgICBub2RlID0gY29udGV4dC5wcmV2KCk7XG4gICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICBpZiAoaXNTZWN0aW9uQ2FsbGJhY2sobm9kZS5yZW5kZXJOb2RlKSkge1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGwgPSBub2RlO1xuICAgICAgICAgICAgICAgIG5vZGVTaXplID0gb3B0aW9ucy5pdGVtU2l6ZSB8fCBjb250ZXh0LnJlc29sdmVTaXplKG5vZGUsIHNpemUpW2RpcmVjdGlvbl07XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbE9mZnNldCA9IG9mZnNldCAtIG5vZGVTaXplO1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxMZW5ndGggPSBub2RlU2l6ZTtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsU2Nyb2xsTGVuZ3RoID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub2RlID0gY29udGV4dC5wcmV2KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGwpIHtcbiAgICAgICAgdmFyIGNvcnJlY3RlZE9mZnNldCA9IE1hdGgubWF4KG1hcmdpblswXSwgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbE9mZnNldCk7XG4gICAgICAgIGlmIChsYXN0Q2VsbE9mZnNldEluRmlyc3RWaXNpYmxlU2VjdGlvbiAhPT0gdW5kZWZpbmVkICYmIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxMZW5ndGggPiBsYXN0Q2VsbE9mZnNldEluRmlyc3RWaXNpYmxlU2VjdGlvbiAtIG1hcmdpblswXSkge1xuICAgICAgICAgICAgY29ycmVjdGVkT2Zmc2V0ID0gbGFzdENlbGxPZmZzZXRJbkZpcnN0VmlzaWJsZVNlY3Rpb24gLSBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsTGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHNldC5zaXplW2RpcmVjdGlvbl0gPSBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsTGVuZ3RoO1xuICAgICAgICBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0gPSBjb3JyZWN0ZWRPZmZzZXQ7XG4gICAgICAgIHNldC5zY3JvbGxMZW5ndGggPSBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsU2Nyb2xsTGVuZ3RoO1xuICAgICAgICBjb250ZXh0LnNldChsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsLCBzZXQpO1xuICAgIH1cbn1cbkxpc3RMYXlvdXQuQ2FwYWJpbGl0aWVzID0gY2FwYWJpbGl0aWVzO1xuTGlzdExheW91dC5OYW1lID0gJ0xpc3RMYXlvdXQnO1xuTGlzdExheW91dC5EZXNjcmlwdGlvbiA9ICdMaXN0LWxheW91dCB3aXRoIG1hcmdpbnMsIHNwYWNpbmcgYW5kIHN0aWNreSBoZWFkZXJzJztcbm1vZHVsZS5leHBvcnRzID0gTGlzdExheW91dDtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsInZhciBMYXlvdXREb2NrSGVscGVyID0gcmVxdWlyZSgnLi4vaGVscGVycy9MYXlvdXREb2NrSGVscGVyJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIE5hdkJhckxheW91dChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGRvY2sgPSBuZXcgTGF5b3V0RG9ja0hlbHBlcihjb250ZXh0LCB7XG4gICAgICAgICAgICBtYXJnaW5zOiBvcHRpb25zLm1hcmdpbnMsXG4gICAgICAgICAgICB0cmFuc2xhdGVaOiAxXG4gICAgICAgIH0pO1xuICAgIGNvbnRleHQuc2V0KCdiYWNrZ3JvdW5kJywgeyBzaXplOiBjb250ZXh0LnNpemUgfSk7XG4gICAgdmFyIG5vZGU7XG4gICAgdmFyIGk7XG4gICAgdmFyIHJpZ2h0SXRlbXMgPSBjb250ZXh0LmdldCgncmlnaHRJdGVtcycpO1xuICAgIGlmIChyaWdodEl0ZW1zKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCByaWdodEl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlID0gY29udGV4dC5nZXQocmlnaHRJdGVtc1tpXSk7XG4gICAgICAgICAgICBkb2NrLnJpZ2h0KG5vZGUsIG9wdGlvbnMucmlnaHRJdGVtV2lkdGggfHwgb3B0aW9ucy5pdGVtV2lkdGgpO1xuICAgICAgICAgICAgZG9jay5yaWdodCh1bmRlZmluZWQsIG9wdGlvbnMucmlnaHRJdGVtU3BhY2VyIHx8IG9wdGlvbnMuaXRlbVNwYWNlcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGxlZnRJdGVtcyA9IGNvbnRleHQuZ2V0KCdsZWZ0SXRlbXMnKTtcbiAgICBpZiAobGVmdEl0ZW1zKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZWZ0SXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5vZGUgPSBjb250ZXh0LmdldChsZWZ0SXRlbXNbaV0pO1xuICAgICAgICAgICAgZG9jay5sZWZ0KG5vZGUsIG9wdGlvbnMubGVmdEl0ZW1XaWR0aCB8fCBvcHRpb25zLml0ZW1XaWR0aCk7XG4gICAgICAgICAgICBkb2NrLmxlZnQodW5kZWZpbmVkLCBvcHRpb25zLmxlZnRJdGVtU3BhY2VyIHx8IG9wdGlvbnMuaXRlbVNwYWNlcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZG9jay5maWxsKCd0aXRsZScpO1xufTsiXX0=
