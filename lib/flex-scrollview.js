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
            this._options = {
                spring: {
                    dampingRatio: 0.8,
                    period: 300
                }
            };
            if (!this._properties) {
                this._properties = {};
            } else {
                for (var propName in this._properties) {
                    this._properties[propName].init = false;
                }
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
        FlowLayoutNode.prototype.setDirectionLock = function (direction, value) {
            if (direction === undefined) {
                this._lockDirection = undefined;
            } else {
                this._lockDirection = direction;
                if (value !== undefined) {
                    if (!this._lockTransitionable) {
                        this._lockTransitionable = new Transitionable(1);
                    }
                    this._lockTransitionable.halt();
                    this._lockTransitionable.reset(value);
                    if (value !== 1) {
                        this._lockTransitionable.set(1, { duration: (1 - value) * 1000 });
                    }
                }
            }
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
            var value;
            var spec = this._spec;
            var precision = this.options.particleRounding;
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
                spec.size[0] = Math.round(prop.curState.x / 0.1) * 0.1;
                spec.size[1] = Math.round(prop.curState.y / 0.1) * 0.1;
            } else {
                spec.size = undefined;
            }
            prop = this._properties.align;
            if (prop && prop.init) {
                spec.align = spec.align || [
                    0,
                    0
                ];
                spec.align[0] = Math.round(prop.curState.x / 0.1) * 0.1;
                spec.align[1] = Math.round(prop.curState.y / 0.1) * 0.1;
            } else {
                spec.align = undefined;
            }
            prop = this._properties.origin;
            if (prop && prop.init) {
                spec.origin = spec.origin || [
                    0,
                    0
                ];
                spec.origin[0] = Math.round(prop.curState.x / 0.1) * 0.1;
                spec.origin[1] = Math.round(prop.curState.y / 0.1) * 0.1;
            } else {
                spec.origin = undefined;
            }
            var translate = this._properties.translate;
            var translateX;
            var translateY;
            var translateZ;
            if (translate && translate.init) {
                translateX = translate.curState.x;
                translateY = translate.curState.y;
                translateZ = translate.curState.z;
                if (this._lockDirection !== undefined) {
                    value = this._lockDirection ? translateY : translateX;
                    var endState = this._lockDirection ? translate.endState.y : translate.endState.x;
                    var lockValue = value + (endState - value) * this._lockTransitionable.get();
                    if (this._lockDirection) {
                        translateX = Math.round(translateX / precision) * precision;
                        translateY = Math.round(lockValue / precision) * precision;
                    } else {
                        translateX = Math.round(lockValue / precision) * precision;
                        translateY = Math.round(translateY / precision) * precision;
                    }
                }
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
                if (isTranslate && this._lockDirection !== undefined && this._lockTransitionable.get() === 1) {
                    immediate = true;
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
            alwaysLayout: false
        };
        function _initFlowLayoutNode(node, spec) {
            if (!spec && this.options.insertSpec) {
                node.setSpec(this.options.insertSpec);
            }
        }
        LayoutController.prototype.setOptions = function setOptions(options) {
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
            for (var i = 0; i < this._commitOutput.target.length; i++) {
                var spec = this._commitOutput.target[i];
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
                this.subscribe(this.container);
                EventHandler.setInputHandler(this.container, this);
                EventHandler.setOutputHandler(this.container, this);
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
            if (node.setDirectionLock) {
                node.setDirectionLock(this._direction, 1);
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
                if (scrollOffset >= 0) {
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
                if (scrollOffset < size[this._direction]) {
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
                if (scrollOffset >= 0) {
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
                if (scrollOffset < size[this._direction]) {
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
        var oldSetDirection = ScrollController.prototype.setDirection;
        ScrollController.prototype.setDirection = function (direction) {
            var oldDirection = this._direction;
            oldSetDirection.call(this, direction);
            if (oldDirection !== this._direction) {
                var node = this._nodes.getStartEnumNode();
                while (node) {
                    if (node._invalidated && node.setDirectionLock) {
                        node.setDirectionLock(this._direction, 0);
                    }
                    node = node._next;
                }
            }
        };
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
                if (this._isDirty || size[0] !== this._contextSizeCache[0] || size[1] !== this._contextSizeCache[1]) {
                    var node = this._nodes.getStartEnumNode();
                    while (node) {
                        if (node._invalidated && node.setDirectionLock) {
                            node.setDirectionLock(this._direction, 0);
                        }
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
            var result = this._nodes.buildSpecAndDestroyUnrenderedNodes(this._layout.capabilities.sequentialScrollingOptimized ? groupTranslate : undefined);
            this._specs = result.specs;
            if (result.modified) {
                this._eventOutput.emit('reflow', { target: this });
            }
            if (emitScrollEvent) {
                this._eventOutput.emit('scroll', eventData);
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
            if (this._layout.capabilities.sequentialScrollingOptimized) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJnbG9iYWwtbm8tZmFtb3VzLnRlbXBsYXRlLmpzIiwic3JjL0ZsZXhTY3JvbGxWaWV3LmpzIiwic3JjL0Zsb3dMYXlvdXROb2RlLmpzIiwic3JjL0xheW91dENvbnRleHQuanMiLCJzcmMvTGF5b3V0Q29udHJvbGxlci5qcyIsInNyYy9MYXlvdXROb2RlLmpzIiwic3JjL0xheW91dE5vZGVNYW5hZ2VyLmpzIiwic3JjL0xheW91dFV0aWxpdHkuanMiLCJzcmMvU2Nyb2xsQ29udHJvbGxlci5qcyIsInNyYy9oZWxwZXJzL0xheW91dERvY2tIZWxwZXIuanMiLCJzcmMvbGF5b3V0cy9Db2xsZWN0aW9uTGF5b3V0LmpzIiwic3JjL2xheW91dHMvQ292ZXJMYXlvdXQuanMiLCJzcmMvbGF5b3V0cy9DdWJlTGF5b3V0LmpzIiwic3JjL2xheW91dHMvR3JpZExheW91dC5qcyIsInNyYy9sYXlvdXRzL0hlYWRlckZvb3RlckxheW91dC5qcyIsInNyYy9sYXlvdXRzL0xpc3RMYXlvdXQuanMiLCJzcmMvbGF5b3V0cy9OYXZCYXJMYXlvdXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDallBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpZiAodHlwZW9mIGlqemVyZW5oZWluID09PSAndW5kZWZpbmVkJykge1xuICAgIGlqemVyZW5oZWluID0ge307XG59XG5cbmlqemVyZW5oZWluLkZsZXhTY3JvbGxWaWV3ID0gcmVxdWlyZSgnLi9zcmMvRmxleFNjcm9sbFZpZXcnKTtcbmlqemVyZW5oZWluLkZsb3dMYXlvdXROb2RlID0gcmVxdWlyZSgnLi9zcmMvRmxvd0xheW91dE5vZGUnKTtcbmlqemVyZW5oZWluLkxheW91dENvbnRleHQgPSByZXF1aXJlKCcuL3NyYy9MYXlvdXRDb250ZXh0Jyk7XG5panplcmVuaGVpbi5MYXlvdXRDb250cm9sbGVyID0gcmVxdWlyZSgnLi9zcmMvTGF5b3V0Q29udHJvbGxlcicpO1xuaWp6ZXJlbmhlaW4uTGF5b3V0Tm9kZSA9IHJlcXVpcmUoJy4vc3JjL0xheW91dE5vZGUnKTtcbmlqemVyZW5oZWluLkxheW91dE5vZGVNYW5hZ2VyID0gcmVxdWlyZSgnLi9zcmMvTGF5b3V0Tm9kZU1hbmFnZXInKTtcbmlqemVyZW5oZWluLkxheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuL3NyYy9MYXlvdXRVdGlsaXR5Jyk7XG5panplcmVuaGVpbi5TY3JvbGxDb250cm9sbGVyID0gcmVxdWlyZSgnLi9zcmMvU2Nyb2xsQ29udHJvbGxlcicpO1xuLy9panplcmVuaGVpbi5TY3JvbGxWaWV3ID0gcmVxdWlyZSgnLi9zcmMvU2Nyb2xsVmlldycpO1xuXG5panplcmVuaGVpbi5sYXlvdXQgPSBpanplcmVuaGVpbi5sYXlvdXQgfHwge307XG5cbmlqemVyZW5oZWluLmxheW91dC5Db2xsZWN0aW9uTGF5b3V0ID0gcmVxdWlyZSgnLi9zcmMvbGF5b3V0cy9Db2xsZWN0aW9uTGF5b3V0Jyk7XG5panplcmVuaGVpbi5sYXlvdXQuQ292ZXJMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL0NvdmVyTGF5b3V0Jyk7XG5panplcmVuaGVpbi5sYXlvdXQuQ3ViZUxheW91dCA9IHJlcXVpcmUoJy4vc3JjL2xheW91dHMvQ3ViZUxheW91dCcpO1xuaWp6ZXJlbmhlaW4ubGF5b3V0LkdyaWRMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL0dyaWRMYXlvdXQnKTtcbmlqemVyZW5oZWluLmxheW91dC5IZWFkZXJGb290ZXJMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL0hlYWRlckZvb3RlckxheW91dCcpO1xuaWp6ZXJlbmhlaW4ubGF5b3V0Lkxpc3RMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL0xpc3RMYXlvdXQnKTtcbmlqemVyZW5oZWluLmxheW91dC5OYXZCYXJMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL05hdkJhckxheW91dCcpO1xuLy9panplcmVuaGVpbi5sYXlvdXQuVGFibGVMYXlvdXQgPSByZXF1aXJlKCcuL3NyYy9sYXlvdXRzL1RhYmxlTGF5b3V0Jyk7XG5cbmlqemVyZW5oZWluLmhlbHBlcnMgPSBpanplcmVuaGVpbi5oZWxwZXJzIHx8IHt9O1xuXG5panplcmVuaGVpbi5oZWxwZXJzLkxheW91dERvY2tIZWxwZXIgPSByZXF1aXJlKCcuL3NyYy9oZWxwZXJzL0xheW91dERvY2tIZWxwZXInKTtcbiIsInZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgU2Nyb2xsQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vU2Nyb2xsQ29udHJvbGxlcicpO1xudmFyIExpc3RMYXlvdXQgPSByZXF1aXJlKCcuL2xheW91dHMvTGlzdExheW91dCcpO1xudmFyIFB1bGxUb1JlZnJlc2hTdGF0ZSA9IHtcbiAgICAgICAgSElEREVOOiAwLFxuICAgICAgICBQVUxMSU5HOiAxLFxuICAgICAgICBBQ1RJVkU6IDIsXG4gICAgICAgIENPTVBMRVRFRDogMyxcbiAgICAgICAgSElERElORzogNFxuICAgIH07XG5mdW5jdGlvbiBGbGV4U2Nyb2xsVmlldyhvcHRpb25zKSB7XG4gICAgU2Nyb2xsQ29udHJvbGxlci5jYWxsKHRoaXMsIExheW91dFV0aWxpdHkuY29tYmluZU9wdGlvbnMoRmxleFNjcm9sbFZpZXcuREVGQVVMVF9PUFRJT05TLCBvcHRpb25zKSk7XG4gICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSA9IDA7XG4gICAgdGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSA9IDA7XG4gICAgdGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEgPSAwO1xufVxuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZSk7XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGbGV4U2Nyb2xsVmlldztcbkZsZXhTY3JvbGxWaWV3LlB1bGxUb1JlZnJlc2hTdGF0ZSA9IFB1bGxUb1JlZnJlc2hTdGF0ZTtcbkZsZXhTY3JvbGxWaWV3LkRFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBsYXlvdXQ6IExpc3RMYXlvdXQsXG4gICAgZGlyZWN0aW9uOiB1bmRlZmluZWQsXG4gICAgcGFnaW5hdGVkOiBmYWxzZSxcbiAgICBhbGlnbm1lbnQ6IDAsXG4gICAgZmxvdzogZmFsc2UsXG4gICAgbW91c2VNb3ZlOiBmYWxzZSxcbiAgICB1c2VDb250YWluZXI6IGZhbHNlLFxuICAgIHZpc2libGVJdGVtVGhyZXNzaG9sZDogMC41LFxuICAgIHB1bGxUb1JlZnJlc2hIZWFkZXI6IHVuZGVmaW5lZCxcbiAgICBwdWxsVG9SZWZyZXNoRm9vdGVyOiB1bmRlZmluZWQsXG4gICAgbGVhZGluZ1Njcm9sbFZpZXc6IHVuZGVmaW5lZCxcbiAgICB0cmFpbGluZ1Njcm9sbFZpZXc6IHVuZGVmaW5lZFxufTtcbkZsZXhTY3JvbGxWaWV3LnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5zZXRPcHRpb25zLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMucHVsbFRvUmVmcmVzaEhlYWRlciB8fCBvcHRpb25zLnB1bGxUb1JlZnJlc2hGb290ZXIgfHwgdGhpcy5fcHVsbFRvUmVmcmVzaCkge1xuICAgICAgICBpZiAob3B0aW9ucy5wdWxsVG9SZWZyZXNoSGVhZGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9wdWxsVG9SZWZyZXNoID0gdGhpcy5fcHVsbFRvUmVmcmVzaCB8fCBbXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHVuZGVmaW5lZFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGlmICghdGhpcy5fcHVsbFRvUmVmcmVzaFswXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2hbMF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiBQdWxsVG9SZWZyZXNoU3RhdGUuSElEREVOLFxuICAgICAgICAgICAgICAgICAgICBwcmV2U3RhdGU6IFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4sXG4gICAgICAgICAgICAgICAgICAgIGZvb3RlcjogZmFsc2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaFswXS5ub2RlID0gb3B0aW9ucy5wdWxsVG9SZWZyZXNoSGVhZGVyO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLm9wdGlvbnMucHVsbFRvUmVmcmVzaEhlYWRlciAmJiB0aGlzLl9wdWxsVG9SZWZyZXNoKSB7XG4gICAgICAgICAgICB0aGlzLl9wdWxsVG9SZWZyZXNoWzBdID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLnB1bGxUb1JlZnJlc2hGb290ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2ggPSB0aGlzLl9wdWxsVG9SZWZyZXNoIHx8IFtcbiAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9wdWxsVG9SZWZyZXNoWzFdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaFsxXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4sXG4gICAgICAgICAgICAgICAgICAgIHByZXZTdGF0ZTogUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERFTixcbiAgICAgICAgICAgICAgICAgICAgZm9vdGVyOiB0cnVlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2hbMV0ubm9kZSA9IG9wdGlvbnMucHVsbFRvUmVmcmVzaEZvb3RlcjtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5vcHRpb25zLnB1bGxUb1JlZnJlc2hGb290ZXIgJiYgdGhpcy5fcHVsbFRvUmVmcmVzaCkge1xuICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaFsxXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcHVsbFRvUmVmcmVzaCAmJiAhdGhpcy5fcHVsbFRvUmVmcmVzaFswXSAmJiAhdGhpcy5fcHVsbFRvUmVmcmVzaFsxXSkge1xuICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuc2VxdWVuY2VGcm9tID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICByZXR1cm4gdGhpcy5zZXREYXRhU291cmNlKG5vZGUpO1xufTtcbkZsZXhTY3JvbGxWaWV3LnByb3RvdHlwZS5nZXRDdXJyZW50SW5kZXggPSBmdW5jdGlvbiBnZXRDdXJyZW50SW5kZXgoKSB7XG4gICAgdmFyIGl0ZW0gPSB0aGlzLmdldEZpcnN0VmlzaWJsZUl0ZW0oKTtcbiAgICByZXR1cm4gaXRlbSA/IGl0ZW0udmlld1NlcXVlbmNlLmdldEluZGV4KCkgOiAtMTtcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ29Ub1BhZ2UgPSBmdW5jdGlvbiBnb1RvUGFnZShpbmRleCkge1xuICAgIHZhciB2aWV3U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2U7XG4gICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHdoaWxlICh2aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKSA8IGluZGV4KSB7XG4gICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgICAgIGlmICghdmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGlsZSAodmlld1NlcXVlbmNlLmdldEluZGV4KCkgPiBpbmRleCkge1xuICAgICAgICB2aWV3U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMuZ29Ub1JlbmRlck5vZGUodmlld1NlcXVlbmNlLmdldCgpKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ2V0T2Zmc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZTtcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ2V0UG9zaXRpb24gPSBGbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ2V0T2Zmc2V0O1xuZnVuY3Rpb24gX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBzdGF0ZSkge1xuICAgIGlmIChwdWxsVG9SZWZyZXNoLnN0YXRlICE9PSBzdGF0ZSkge1xuICAgICAgICBwdWxsVG9SZWZyZXNoLnN0YXRlID0gc3RhdGU7XG4gICAgICAgIGlmIChwdWxsVG9SZWZyZXNoLm5vZGUgJiYgcHVsbFRvUmVmcmVzaC5ub2RlLnNldFB1bGxUb1JlZnJlc2hTdGF0dXMpIHtcbiAgICAgICAgICAgIHB1bGxUb1JlZnJlc2gubm9kZS5zZXRQdWxsVG9SZWZyZXNoU3RhdHVzKHN0YXRlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIF9nZXRQdWxsVG9SZWZyZXNoKGZvb3Rlcikge1xuICAgIHJldHVybiB0aGlzLl9wdWxsVG9SZWZyZXNoID8gdGhpcy5fcHVsbFRvUmVmcmVzaFtmb290ZXIgPyAxIDogMF0gOiB1bmRlZmluZWQ7XG59XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuX3Bvc3RMYXlvdXQgPSBmdW5jdGlvbiAoc2l6ZSwgc2Nyb2xsT2Zmc2V0KSB7XG4gICAgaWYgKCF0aGlzLl9wdWxsVG9SZWZyZXNoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IHNpemVbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICB9XG4gICAgdmFyIHByZXZIZWlnaHQ7XG4gICAgdmFyIG5leHRIZWlnaHQ7XG4gICAgdmFyIHRvdGFsSGVpZ2h0O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjsgaSsrKSB7XG4gICAgICAgIHZhciBwdWxsVG9SZWZyZXNoID0gdGhpcy5fcHVsbFRvUmVmcmVzaFtpXTtcbiAgICAgICAgaWYgKHB1bGxUb1JlZnJlc2gpIHtcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBwdWxsVG9SZWZyZXNoLm5vZGUuZ2V0U2l6ZSgpW3RoaXMuX2RpcmVjdGlvbl07XG4gICAgICAgICAgICB2YXIgcHVsbExlbmd0aCA9IHB1bGxUb1JlZnJlc2gubm9kZS5nZXRQdWxsVG9SZWZyZXNoU2l6ZSA/IHB1bGxUb1JlZnJlc2gubm9kZS5nZXRQdWxsVG9SZWZyZXNoU2l6ZSgpW3RoaXMuX2RpcmVjdGlvbl0gOiBsZW5ndGg7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0O1xuICAgICAgICAgICAgaWYgKCFwdWxsVG9SZWZyZXNoLmZvb3Rlcikge1xuICAgICAgICAgICAgICAgIHByZXZIZWlnaHQgPSB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KGZhbHNlKTtcbiAgICAgICAgICAgICAgICBwcmV2SGVpZ2h0ID0gcHJldkhlaWdodCA9PT0gdW5kZWZpbmVkID8gLTEgOiBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgICAgIG9mZnNldCA9IHByZXZIZWlnaHQgPj0gMCA/IHNjcm9sbE9mZnNldCAtIHByZXZIZWlnaHQgOiBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRIZWlnaHQgPSB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0SGVpZ2h0ID0gbmV4dEhlaWdodCA9PT0gdW5kZWZpbmVkID8gLTEgOiBuZXh0SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB0b3RhbEhlaWdodCA9IHByZXZIZWlnaHQgPj0gMCAmJiBuZXh0SGVpZ2h0ID49IDAgPyBwcmV2SGVpZ2h0ICsgbmV4dEhlaWdodCA6IC0xO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG90YWxIZWlnaHQgPj0gMCAmJiB0b3RhbEhlaWdodCA8IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gTWF0aC5yb3VuZChzY3JvbGxPZmZzZXQgLSBzaXplW3RoaXMuX2RpcmVjdGlvbl0gKyBuZXh0SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV4dEhlaWdodCA9IG5leHRIZWlnaHQgPT09IHVuZGVmaW5lZCA/IG5leHRIZWlnaHQgPSB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KHRydWUpIDogbmV4dEhlaWdodDtcbiAgICAgICAgICAgICAgICBuZXh0SGVpZ2h0ID0gbmV4dEhlaWdodCA9PT0gdW5kZWZpbmVkID8gLTEgOiBuZXh0SGVpZ2h0O1xuICAgICAgICAgICAgICAgIG9mZnNldCA9IG5leHRIZWlnaHQgPj0gMCA/IHNjcm9sbE9mZnNldCArIG5leHRIZWlnaHQgOiBzaXplW3RoaXMuX2RpcmVjdGlvbl0gKyAxO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2SGVpZ2h0ID0gcHJldkhlaWdodCA9PT0gdW5kZWZpbmVkID8gdGhpcy5fY2FsY1Njcm9sbEhlaWdodChmYWxzZSkgOiBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBwcmV2SGVpZ2h0ID0gcHJldkhlaWdodCA9PT0gdW5kZWZpbmVkID8gLTEgOiBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB0b3RhbEhlaWdodCA9IHByZXZIZWlnaHQgPj0gMCAmJiBuZXh0SGVpZ2h0ID49IDAgPyBwcmV2SGVpZ2h0ICsgbmV4dEhlaWdodCA6IC0xO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG90YWxIZWlnaHQgPj0gMCAmJiB0b3RhbEhlaWdodCA8IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gTWF0aC5yb3VuZChzY3JvbGxPZmZzZXQgLSBwcmV2SGVpZ2h0ICsgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvZmZzZXQgPSAtKG9mZnNldCAtIHNpemVbdGhpcy5fZGlyZWN0aW9uXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdmlzaWJsZVBlcmMgPSBNYXRoLm1heChNYXRoLm1pbihvZmZzZXQgLyBwdWxsTGVuZ3RoLCAxKSwgMCk7XG4gICAgICAgICAgICBzd2l0Y2ggKHB1bGxUb1JlZnJlc2guc3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERFTjpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZpc2libGVQZXJjID49IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgUHVsbFRvUmVmcmVzaFN0YXRlLkFDVElWRSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob2Zmc2V0ID49IDAuMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBQdWxsVG9SZWZyZXNoU3RhdGUuUFVMTElORyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFB1bGxUb1JlZnJlc2hTdGF0ZS5QVUxMSU5HOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCAmJiB2aXNpYmxlUGVyYyA+PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgUHVsbFRvUmVmcmVzaFN0YXRlLkFDVElWRSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvZmZzZXQgPCAwLjIpIHtcbiAgICAgICAgICAgICAgICAgICAgX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBQdWxsVG9SZWZyZXNoU3RhdGUuSElEREVOKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkU6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFB1bGxUb1JlZnJlc2hTdGF0ZS5DT01QTEVURUQ6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ID49IDAuMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBQdWxsVG9SZWZyZXNoU3RhdGUuSElERElORyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfc2V0UHVsbFRvUmVmcmVzaFN0YXRlKHB1bGxUb1JlZnJlc2gsIFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQdWxsVG9SZWZyZXNoU3RhdGUuSElERElORzpcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0IDwgMC4yKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERFTik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHB1bGxUb1JlZnJlc2guc3RhdGUgIT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dE5vZGUgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJOb2RlOiBwdWxsVG9SZWZyZXNoLm5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2OiAhcHVsbFRvUmVmcmVzaC5mb290ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBwdWxsVG9SZWZyZXNoLmZvb3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiAhcHVsbFRvUmVmcmVzaC5mb290ZXIgPyAtLXRoaXMuX25vZGVzLl9jb250ZXh0U3RhdGUucHJldkdldEluZGV4IDogKyt0aGlzLl9ub2Rlcy5fY29udGV4dFN0YXRlLm5leHRHZXRJbmRleFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICAgICAgaWYgKHB1bGxUb1JlZnJlc2guc3RhdGUgPT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoID0gbGVuZ3RoO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoID0gTWF0aC5taW4ob2Zmc2V0LCBsZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgc2V0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemVbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZVsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtMC4wMDFcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxMZW5ndGg6IHNjcm9sbExlbmd0aFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHNldC5zaXplW3RoaXMuX2RpcmVjdGlvbl0gPSBNYXRoLm1heChNYXRoLm1pbihvZmZzZXQsIHB1bGxMZW5ndGgpLCAwKTtcbiAgICAgICAgICAgICAgICBzZXQudHJhbnNsYXRlW3RoaXMuX2RpcmVjdGlvbl0gPSBwdWxsVG9SZWZyZXNoLmZvb3RlciA/IHNpemVbdGhpcy5fZGlyZWN0aW9uXSAtIGxlbmd0aCA6IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZXMuX2NvbnRleHQuc2V0KGNvbnRleHROb2RlLCBzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcbkZsZXhTY3JvbGxWaWV3LnByb3RvdHlwZS5zaG93UHVsbFRvUmVmcmVzaCA9IGZ1bmN0aW9uIChmb290ZXIpIHtcbiAgICB2YXIgcHVsbFRvUmVmcmVzaCA9IF9nZXRQdWxsVG9SZWZyZXNoLmNhbGwodGhpcywgZm9vdGVyKTtcbiAgICBpZiAocHVsbFRvUmVmcmVzaCkge1xuICAgICAgICBfc2V0UHVsbFRvUmVmcmVzaFN0YXRlKHB1bGxUb1JlZnJlc2gsIFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUpO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgPSB0cnVlO1xuICAgIH1cbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuaGlkZVB1bGxUb1JlZnJlc2ggPSBmdW5jdGlvbiAoZm9vdGVyKSB7XG4gICAgdmFyIHB1bGxUb1JlZnJlc2ggPSBfZ2V0UHVsbFRvUmVmcmVzaC5jYWxsKHRoaXMsIGZvb3Rlcik7XG4gICAgaWYgKHB1bGxUb1JlZnJlc2ggJiYgcHVsbFRvUmVmcmVzaC5zdGF0ZSA9PT0gUHVsbFRvUmVmcmVzaFN0YXRlLkFDVElWRSkge1xuICAgICAgICBfc2V0UHVsbFRvUmVmcmVzaFN0YXRlKHB1bGxUb1JlZnJlc2gsIFB1bGxUb1JlZnJlc2hTdGF0ZS5DT01QTEVURUQpO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuaXNQdWxsVG9SZWZyZXNoVmlzaWJsZSA9IGZ1bmN0aW9uIChmb290ZXIpIHtcbiAgICB2YXIgcHVsbFRvUmVmcmVzaCA9IF9nZXRQdWxsVG9SZWZyZXNoLmNhbGwodGhpcywgZm9vdGVyKTtcbiAgICByZXR1cm4gcHVsbFRvUmVmcmVzaCA/IHB1bGxUb1JlZnJlc2guc3RhdGUgPT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUgOiBmYWxzZTtcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuYXBwbHlTY3JvbGxGb3JjZSA9IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgIHZhciBsZWFkaW5nU2Nyb2xsVmlldyA9IHRoaXMub3B0aW9ucy5sZWFkaW5nU2Nyb2xsVmlldztcbiAgICB2YXIgdHJhaWxpbmdTY3JvbGxWaWV3ID0gdGhpcy5vcHRpb25zLnRyYWlsaW5nU2Nyb2xsVmlldztcbiAgICBpZiAoIWxlYWRpbmdTY3JvbGxWaWV3ICYmICF0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgcmV0dXJuIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmFwcGx5U2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgfVxuICAgIHZhciBwYXJ0aWFsRGVsdGE7XG4gICAgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICBpZiAobGVhZGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IGxlYWRpbmdTY3JvbGxWaWV3LmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhICs9IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGxlYWRpbmdTY3JvbGxWaWV3LmFwcGx5U2Nyb2xsRm9yY2UocGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSB0aGlzLmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5hcHBseVNjcm9sbEZvcmNlLmNhbGwodGhpcywgcGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKz0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LmFwcGx5U2Nyb2xsRm9yY2UoZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5hcHBseVNjcm9sbEZvcmNlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IHRyYWlsaW5nU2Nyb2xsVmlldy5jYW5TY3JvbGwoZGVsdGEpO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LmFwcGx5U2Nyb2xsRm9yY2UocGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhICs9IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVhZGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IHRoaXMuY2FuU2Nyb2xsKGRlbHRhKTtcbiAgICAgICAgICAgIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmFwcGx5U2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCBwYXJ0aWFsRGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBsZWFkaW5nU2Nyb2xsVmlldy5hcHBseVNjcm9sbEZvcmNlKGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX2xlYWRpbmdTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5hcHBseVNjcm9sbEZvcmNlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUudXBkYXRlU2Nyb2xsRm9yY2UgPSBmdW5jdGlvbiAocHJldkRlbHRhLCBuZXdEZWx0YSkge1xuICAgIHZhciBsZWFkaW5nU2Nyb2xsVmlldyA9IHRoaXMub3B0aW9ucy5sZWFkaW5nU2Nyb2xsVmlldztcbiAgICB2YXIgdHJhaWxpbmdTY3JvbGxWaWV3ID0gdGhpcy5vcHRpb25zLnRyYWlsaW5nU2Nyb2xsVmlldztcbiAgICBpZiAoIWxlYWRpbmdTY3JvbGxWaWV3ICYmICF0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgcmV0dXJuIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgcHJldkRlbHRhLCBuZXdEZWx0YSk7XG4gICAgfVxuICAgIHZhciBwYXJ0aWFsRGVsdGE7XG4gICAgdmFyIGRlbHRhID0gbmV3RGVsdGEgLSBwcmV2RGVsdGE7XG4gICAgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICBpZiAobGVhZGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IGxlYWRpbmdTY3JvbGxWaWV3LmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICBsZWFkaW5nU2Nyb2xsVmlldy51cGRhdGVTY3JvbGxGb3JjZSh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhICsgcGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX2xlYWRpbmdTY3JvbGxWaWV3RGVsdGEgKz0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFpbGluZ1Njcm9sbFZpZXcgJiYgZGVsdGEpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IHRoaXMuY2FuU2Nyb2xsKGRlbHRhKTtcbiAgICAgICAgICAgIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArIHBhcnRpYWxEZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhICs9IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhICs9IGRlbHRhO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSArIGRlbHRhKTtcbiAgICAgICAgfSBlbHNlIGlmIChkZWx0YSkge1xuICAgICAgICAgICAgU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUudXBkYXRlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhICsgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IHRyYWlsaW5nU2Nyb2xsVmlldy5jYW5TY3JvbGwoZGVsdGEpO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSArIHBhcnRpYWxEZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSArPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxlYWRpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSB0aGlzLmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVTY3JvbGxGb3JjZS5jYWxsKHRoaXMsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKyBwYXJ0aWFsRGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBsZWFkaW5nU2Nyb2xsVmlldy51cGRhdGVTY3JvbGxGb3JjZSh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhICsgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArIGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLnJlbGVhc2VTY3JvbGxGb3JjZSA9IGZ1bmN0aW9uIChkZWx0YSwgdmVsb2NpdHkpIHtcbiAgICB2YXIgbGVhZGluZ1Njcm9sbFZpZXcgPSB0aGlzLm9wdGlvbnMubGVhZGluZ1Njcm9sbFZpZXc7XG4gICAgdmFyIHRyYWlsaW5nU2Nyb2xsVmlldyA9IHRoaXMub3B0aW9ucy50cmFpbGluZ1Njcm9sbFZpZXc7XG4gICAgaWYgKCFsZWFkaW5nU2Nyb2xsVmlldyAmJiAhdHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgIHJldHVybiBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCBkZWx0YSwgdmVsb2NpdHkpO1xuICAgIH1cbiAgICB2YXIgcGFydGlhbERlbHRhO1xuICAgIGlmIChkZWx0YSA8IDApIHtcbiAgICAgICAgaWYgKGxlYWRpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSBNYXRoLm1heCh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGxlYWRpbmdTY3JvbGxWaWV3LnJlbGVhc2VTY3JvbGxGb3JjZSh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IDAgOiB2ZWxvY2l0eSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyYWlsaW5nU2Nyb2xsVmlldykge1xuICAgICAgICAgICAgcGFydGlhbERlbHRhID0gTWF0aC5tYXgodGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IDAgOiB2ZWxvY2l0eSk7XG4gICAgICAgICAgICB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSAtPSBkZWx0YTtcbiAgICAgICAgICAgIHRyYWlsaW5nU2Nyb2xsVmlldy5yZWxlYXNlU2Nyb2xsRm9yY2UodGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEsIGRlbHRhID8gdmVsb2NpdHkgOiAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgLT0gZGVsdGE7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IHZlbG9jaXR5IDogMCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSBNYXRoLm1pbih0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LnJlbGVhc2VTY3JvbGxGb3JjZSh0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEgPyAwIDogdmVsb2NpdHkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZWFkaW5nU2Nyb2xsVmlldykge1xuICAgICAgICAgICAgcGFydGlhbERlbHRhID0gTWF0aC5taW4odGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IDAgOiB2ZWxvY2l0eSk7XG4gICAgICAgICAgICB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhIC09IGRlbHRhO1xuICAgICAgICAgICAgbGVhZGluZ1Njcm9sbFZpZXcucmVsZWFzZVNjcm9sbEZvcmNlKHRoaXMuX2xlYWRpbmdTY3JvbGxWaWV3RGVsdGEsIGRlbHRhID8gdmVsb2NpdHkgOiAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgLT0gZGVsdGE7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVTY3JvbGxGb3JjZS5jYWxsKHRoaXMsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEsIGRlbHRhID8gdmVsb2NpdHkgOiAwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuY29tbWl0ID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0ID0gU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuY29tbWl0LmNhbGwodGhpcywgY29udGV4dCk7XG4gICAgaWYgKHRoaXMuX3B1bGxUb1JlZnJlc2gpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwdWxsVG9SZWZyZXNoID0gdGhpcy5fcHVsbFRvUmVmcmVzaFtpXTtcbiAgICAgICAgICAgIGlmIChwdWxsVG9SZWZyZXNoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHB1bGxUb1JlZnJlc2guc3RhdGUgPT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUgJiYgcHVsbFRvUmVmcmVzaC5wcmV2U3RhdGUgIT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgncmVmcmVzaCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvb3RlcjogcHVsbFRvUmVmcmVzaC5mb290ZXJcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHB1bGxUb1JlZnJlc2gucHJldlN0YXRlID0gcHVsbFRvUmVmcmVzaC5zdGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbm1vZHVsZS5leHBvcnRzID0gRmxleFNjcm9sbFZpZXc7IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIE9wdGlvbnNNYW5hZ2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuT3B0aW9uc01hbmFnZXIgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5PcHRpb25zTWFuYWdlciA6IG51bGw7XG52YXIgVHJhbnNmb3JtID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogbnVsbDtcbnZhciBWZWN0b3IgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMubWF0aC5WZWN0b3IgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMubWF0aC5WZWN0b3IgOiBudWxsO1xudmFyIFBhcnRpY2xlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnBoeXNpY3MuYm9kaWVzLlBhcnRpY2xlIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnBoeXNpY3MuYm9kaWVzLlBhcnRpY2xlIDogbnVsbDtcbnZhciBTcHJpbmcgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMucGh5c2ljcy5mb3JjZXMuU3ByaW5nIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnBoeXNpY3MuZm9yY2VzLlNwcmluZyA6IG51bGw7XG52YXIgUGh5c2ljc0VuZ2luZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5waHlzaWNzLlBoeXNpY3NFbmdpbmUgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMucGh5c2ljcy5QaHlzaWNzRW5naW5lIDogbnVsbDtcbnZhciBMYXlvdXROb2RlID0gcmVxdWlyZSgnLi9MYXlvdXROb2RlJyk7XG52YXIgVHJhbnNpdGlvbmFibGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudHJhbnNpdGlvbnMuVHJhbnNpdGlvbmFibGUgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMudHJhbnNpdGlvbnMuVHJhbnNpdGlvbmFibGUgOiBudWxsO1xuZnVuY3Rpb24gRmxvd0xheW91dE5vZGUocmVuZGVyTm9kZSwgc3BlYykge1xuICAgIExheW91dE5vZGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAoIXRoaXMub3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuY3JlYXRlKHRoaXMuY29uc3RydWN0b3IuREVGQVVMVF9PUFRJT05TKTtcbiAgICAgICAgdGhpcy5fb3B0aW9uc01hbmFnZXIgPSBuZXcgT3B0aW9uc01hbmFnZXIodGhpcy5vcHRpb25zKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9wZSkge1xuICAgICAgICB0aGlzLl9wZSA9IG5ldyBQaHlzaWNzRW5naW5lKCk7XG4gICAgICAgIHRoaXMuX3BlLnNsZWVwKCk7XG4gICAgfVxuICAgIHRoaXMuX29wdGlvbnMgPSB7XG4gICAgICAgIHNwcmluZzoge1xuICAgICAgICAgICAgZGFtcGluZ1JhdGlvOiAwLjgsXG4gICAgICAgICAgICBwZXJpb2Q6IDMwMFxuICAgICAgICB9XG4gICAgfTtcbiAgICBpZiAoIXRoaXMuX3Byb3BlcnRpZXMpIHtcbiAgICAgICAgdGhpcy5fcHJvcGVydGllcyA9IHt9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIHByb3BOYW1lIGluIHRoaXMuX3Byb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BlcnRpZXNbcHJvcE5hbWVdLmluaXQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSB0cnVlO1xuICAgIHRoaXMuX2luaXRpYWwgPSB0cnVlO1xuICAgIGlmIChzcGVjKSB7XG4gICAgICAgIHRoaXMuc2V0U3BlYyhzcGVjKTtcbiAgICB9XG59XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKExheW91dE5vZGUucHJvdG90eXBlKTtcbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZsb3dMYXlvdXROb2RlO1xuRmxvd0xheW91dE5vZGUuREVGQVVMVF9PUFRJT05TID0ge1xuICAgIHNwcmluZzoge1xuICAgICAgICBkYW1waW5nUmF0aW86IDAuOCxcbiAgICAgICAgcGVyaW9kOiAzMDBcbiAgICB9LFxuICAgIHBhcnRpY2xlUm91bmRpbmc6IDAuMDAxXG59O1xudmFyIERFRkFVTFQgPSB7XG4gICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgIG9wYWNpdHkyRDogW1xuICAgICAgICAgICAgMSxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBhbGlnbjogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgc2NhbGU6IFtcbiAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAxLFxuICAgICAgICAgICAgMVxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICByb3RhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBza2V3OiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXVxuICAgIH07XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdGhpcy5fb3B0aW9uc01hbmFnZXIuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICB2YXIgd2FzU2xlZXBpbmcgPSB0aGlzLl9wZS5pc1NsZWVwaW5nKCk7XG4gICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gdGhpcy5fcHJvcGVydGllcykge1xuICAgICAgICB2YXIgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXNbcHJvcE5hbWVdO1xuICAgICAgICBpZiAocHJvcC5mb3JjZSkge1xuICAgICAgICAgICAgcHJvcC5mb3JjZS5zZXRPcHRpb25zKHByb3AuZm9yY2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh3YXNTbGVlcGluZykge1xuICAgICAgICB0aGlzLl9wZS5zbGVlcCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUuc2V0U3BlYyA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gICAgdmFyIHNldDtcbiAgICBpZiAoc3BlYy50cmFuc2Zvcm0pIHtcbiAgICAgICAgc2V0ID0gVHJhbnNmb3JtLmludGVycHJldChzcGVjLnRyYW5zZm9ybSk7XG4gICAgfVxuICAgIGlmICghc2V0KSB7XG4gICAgICAgIHNldCA9IHt9O1xuICAgIH1cbiAgICBzZXQub3BhY2l0eSA9IHNwZWMub3BhY2l0eTtcbiAgICBzZXQuc2l6ZSA9IHNwZWMuc2l6ZTtcbiAgICBzZXQuYWxpZ24gPSBzcGVjLmFsaWduO1xuICAgIHNldC5vcmlnaW4gPSBzcGVjLm9yaWdpbjtcbiAgICB2YXIgb2xkUmVtb3ZpbmcgPSB0aGlzLl9yZW1vdmluZztcbiAgICB2YXIgb2xkSW52YWxpZGF0ZWQgPSB0aGlzLl9pbnZhbGlkYXRlZDtcbiAgICB0aGlzLnNldChzZXQpO1xuICAgIHRoaXMuX3JlbW92aW5nID0gb2xkUmVtb3Zpbmc7XG4gICAgdGhpcy5faW52YWxpZGF0ZWQgPSBvbGRJbnZhbGlkYXRlZDtcbn07XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2ludmFsaWRhdGVkKSB7XG4gICAgICAgIGZvciAodmFyIHByb3BOYW1lIGluIHRoaXMuX3Byb3BlcnRpZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BlcnRpZXNbcHJvcE5hbWVdLmludmFsaWRhdGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faW52YWxpZGF0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy50cnVlU2l6ZVJlcXVlc3RlZCA9IGZhbHNlO1xuICAgIHRoaXMudXNlc1RydWVTaXplID0gZmFsc2U7XG59O1xuRmxvd0xheW91dE5vZGUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChyZW1vdmVTcGVjKSB7XG4gICAgdGhpcy5fcmVtb3ZpbmcgPSB0cnVlO1xuICAgIGlmIChyZW1vdmVTcGVjKSB7XG4gICAgICAgIHRoaXMuc2V0U3BlYyhyZW1vdmVTcGVjKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wZS5zbGVlcCgpO1xuICAgICAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5faW52YWxpZGF0ZWQgPSBmYWxzZTtcbn07XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUuc2V0RGlyZWN0aW9uTG9jayA9IGZ1bmN0aW9uIChkaXJlY3Rpb24sIHZhbHVlKSB7XG4gICAgaWYgKGRpcmVjdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuX2xvY2tEaXJlY3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbG9ja0RpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fbG9ja1RyYW5zaXRpb25hYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbG9ja1RyYW5zaXRpb25hYmxlID0gbmV3IFRyYW5zaXRpb25hYmxlKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fbG9ja1RyYW5zaXRpb25hYmxlLmhhbHQoKTtcbiAgICAgICAgICAgIHRoaXMuX2xvY2tUcmFuc2l0aW9uYWJsZS5yZXNldCh2YWx1ZSk7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2NrVHJhbnNpdGlvbmFibGUuc2V0KDEsIHsgZHVyYXRpb246ICgxIC0gdmFsdWUpICogMTAwMCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5mdW5jdGlvbiBfZ2V0Um91bmRlZFZhbHVlM0QocHJvcCwgZGVmLCBwcmVjaXNpb24pIHtcbiAgICBpZiAoIXByb3AgfHwgIXByb3AuaW5pdCkge1xuICAgICAgICByZXR1cm4gZGVmO1xuICAgIH1cbiAgICBwcmVjaXNpb24gPSBwcmVjaXNpb24gfHwgdGhpcy5vcHRpb25zLnBhcnRpY2xlUm91bmRpbmc7XG4gICAgdmFyIHZhbHVlID0gcHJvcC5wYXJ0aWNsZS5nZXRQb3NpdGlvbigpO1xuICAgIHJldHVybiBbXG4gICAgICAgIE1hdGgucm91bmQodmFsdWVbMF0gLyBwcmVjaXNpb24pICogcHJlY2lzaW9uLFxuICAgICAgICBNYXRoLnJvdW5kKHZhbHVlWzFdIC8gcHJlY2lzaW9uKSAqIHByZWNpc2lvbixcbiAgICAgICAgTWF0aC5yb3VuZCh2YWx1ZVsyXSAvIHByZWNpc2lvbikgKiBwcmVjaXNpb25cbiAgICBdO1xufVxuRmxvd0xheW91dE5vZGUucHJvdG90eXBlLmdldFNwZWMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGVuZFN0YXRlUmVhY2hlZCA9IHRoaXMuX3BlLmlzU2xlZXBpbmcoKTtcbiAgICBpZiAoIXRoaXMuX3NwZWNNb2RpZmllZCAmJiBlbmRTdGF0ZVJlYWNoZWQpIHtcbiAgICAgICAgdGhpcy5fc3BlYy5yZW1vdmVkID0gIXRoaXMuX2ludmFsaWRhdGVkO1xuICAgICAgICByZXR1cm4gdGhpcy5fc3BlYztcbiAgICB9XG4gICAgdGhpcy5faW5pdGlhbCA9IGZhbHNlO1xuICAgIHRoaXMuX3NwZWNNb2RpZmllZCA9ICFlbmRTdGF0ZVJlYWNoZWQ7XG4gICAgdGhpcy5fc3BlYy5yZW1vdmVkID0gZmFsc2U7XG4gICAgaWYgKCFlbmRTdGF0ZVJlYWNoZWQpIHtcbiAgICAgICAgdGhpcy5fcGUuc3RlcCgpO1xuICAgIH1cbiAgICB2YXIgdmFsdWU7XG4gICAgdmFyIHNwZWMgPSB0aGlzLl9zcGVjO1xuICAgIHZhciBwcmVjaXNpb24gPSB0aGlzLm9wdGlvbnMucGFydGljbGVSb3VuZGluZztcbiAgICB2YXIgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMub3BhY2l0eTtcbiAgICBpZiAocHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgc3BlYy5vcGFjaXR5ID0gTWF0aC5yb3VuZChNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBwcm9wLmN1clN0YXRlLngpKSAvIHByZWNpc2lvbikgKiBwcmVjaXNpb247XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3BlYy5vcGFjaXR5ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5zaXplO1xuICAgIGlmIChwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBzcGVjLnNpemUgPSBzcGVjLnNpemUgfHwgW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICAgICAgc3BlYy5zaXplWzBdID0gTWF0aC5yb3VuZChwcm9wLmN1clN0YXRlLnggLyAwLjEpICogMC4xO1xuICAgICAgICBzcGVjLnNpemVbMV0gPSBNYXRoLnJvdW5kKHByb3AuY3VyU3RhdGUueSAvIDAuMSkgKiAwLjE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3BlYy5zaXplID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5hbGlnbjtcbiAgICBpZiAocHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgc3BlYy5hbGlnbiA9IHNwZWMuYWxpZ24gfHwgW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICAgICAgc3BlYy5hbGlnblswXSA9IE1hdGgucm91bmQocHJvcC5jdXJTdGF0ZS54IC8gMC4xKSAqIDAuMTtcbiAgICAgICAgc3BlYy5hbGlnblsxXSA9IE1hdGgucm91bmQocHJvcC5jdXJTdGF0ZS55IC8gMC4xKSAqIDAuMTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzcGVjLmFsaWduID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5vcmlnaW47XG4gICAgaWYgKHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIHNwZWMub3JpZ2luID0gc3BlYy5vcmlnaW4gfHwgW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICAgICAgc3BlYy5vcmlnaW5bMF0gPSBNYXRoLnJvdW5kKHByb3AuY3VyU3RhdGUueCAvIDAuMSkgKiAwLjE7XG4gICAgICAgIHNwZWMub3JpZ2luWzFdID0gTWF0aC5yb3VuZChwcm9wLmN1clN0YXRlLnkgLyAwLjEpICogMC4xO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMub3JpZ2luID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB2YXIgdHJhbnNsYXRlID0gdGhpcy5fcHJvcGVydGllcy50cmFuc2xhdGU7XG4gICAgdmFyIHRyYW5zbGF0ZVg7XG4gICAgdmFyIHRyYW5zbGF0ZVk7XG4gICAgdmFyIHRyYW5zbGF0ZVo7XG4gICAgaWYgKHRyYW5zbGF0ZSAmJiB0cmFuc2xhdGUuaW5pdCkge1xuICAgICAgICB0cmFuc2xhdGVYID0gdHJhbnNsYXRlLmN1clN0YXRlLng7XG4gICAgICAgIHRyYW5zbGF0ZVkgPSB0cmFuc2xhdGUuY3VyU3RhdGUueTtcbiAgICAgICAgdHJhbnNsYXRlWiA9IHRyYW5zbGF0ZS5jdXJTdGF0ZS56O1xuICAgICAgICBpZiAodGhpcy5fbG9ja0RpcmVjdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHRoaXMuX2xvY2tEaXJlY3Rpb24gPyB0cmFuc2xhdGVZIDogdHJhbnNsYXRlWDtcbiAgICAgICAgICAgIHZhciBlbmRTdGF0ZSA9IHRoaXMuX2xvY2tEaXJlY3Rpb24gPyB0cmFuc2xhdGUuZW5kU3RhdGUueSA6IHRyYW5zbGF0ZS5lbmRTdGF0ZS54O1xuICAgICAgICAgICAgdmFyIGxvY2tWYWx1ZSA9IHZhbHVlICsgKGVuZFN0YXRlIC0gdmFsdWUpICogdGhpcy5fbG9ja1RyYW5zaXRpb25hYmxlLmdldCgpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2xvY2tEaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGVYID0gTWF0aC5yb3VuZCh0cmFuc2xhdGVYIC8gcHJlY2lzaW9uKSAqIHByZWNpc2lvbjtcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGVZID0gTWF0aC5yb3VuZChsb2NrVmFsdWUgLyBwcmVjaXNpb24pICogcHJlY2lzaW9uO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGVYID0gTWF0aC5yb3VuZChsb2NrVmFsdWUgLyBwcmVjaXNpb24pICogcHJlY2lzaW9uO1xuICAgICAgICAgICAgICAgIHRyYW5zbGF0ZVkgPSBNYXRoLnJvdW5kKHRyYW5zbGF0ZVkgLyBwcmVjaXNpb24pICogcHJlY2lzaW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJhbnNsYXRlWCA9IDA7XG4gICAgICAgIHRyYW5zbGF0ZVkgPSAwO1xuICAgICAgICB0cmFuc2xhdGVaID0gMDtcbiAgICB9XG4gICAgdmFyIHNjYWxlID0gdGhpcy5fcHJvcGVydGllcy5zY2FsZTtcbiAgICB2YXIgc2tldyA9IHRoaXMuX3Byb3BlcnRpZXMuc2tldztcbiAgICB2YXIgcm90YXRlID0gdGhpcy5fcHJvcGVydGllcy5yb3RhdGU7XG4gICAgaWYgKHNjYWxlIHx8IHNrZXcgfHwgcm90YXRlKSB7XG4gICAgICAgIHNwZWMudHJhbnNmb3JtID0gVHJhbnNmb3JtLmJ1aWxkKHtcbiAgICAgICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgICAgIHRyYW5zbGF0ZVgsXG4gICAgICAgICAgICAgICAgdHJhbnNsYXRlWSxcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGVaXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgc2tldzogX2dldFJvdW5kZWRWYWx1ZTNELmNhbGwodGhpcywgc2tldywgREVGQVVMVC5za2V3KSxcbiAgICAgICAgICAgIHNjYWxlOiBfZ2V0Um91bmRlZFZhbHVlM0QuY2FsbCh0aGlzLCBzY2FsZSwgREVGQVVMVC5zY2FsZSksXG4gICAgICAgICAgICByb3RhdGU6IF9nZXRSb3VuZGVkVmFsdWUzRC5jYWxsKHRoaXMsIHJvdGF0ZSwgREVGQVVMVC5yb3RhdGUpXG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHJhbnNsYXRlKSB7XG4gICAgICAgIGlmICghc3BlYy50cmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIHNwZWMudHJhbnNmb3JtID0gVHJhbnNmb3JtLnRyYW5zbGF0ZSh0cmFuc2xhdGVYLCB0cmFuc2xhdGVZLCB0cmFuc2xhdGVaKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNwZWMudHJhbnNmb3JtWzEyXSA9IHRyYW5zbGF0ZVg7XG4gICAgICAgICAgICBzcGVjLnRyYW5zZm9ybVsxM10gPSB0cmFuc2xhdGVZO1xuICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTRdID0gdHJhbnNsYXRlWjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMudHJhbnNmb3JtID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fc3BlYztcbn07XG5mdW5jdGlvbiBfc2V0UHJvcGVydHlWYWx1ZShwcm9wLCBwcm9wTmFtZSwgZW5kU3RhdGUsIGRlZmF1bHRWYWx1ZSwgaW1tZWRpYXRlLCBpc1RyYW5zbGF0ZSkge1xuICAgIHByb3AgPSBwcm9wIHx8IHRoaXMuX3Byb3BlcnRpZXNbcHJvcE5hbWVdO1xuICAgIGlmIChwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBwcm9wLmludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIHZhbHVlID0gZGVmYXVsdFZhbHVlO1xuICAgICAgICBpZiAoZW5kU3RhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFsdWUgPSBlbmRTdGF0ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9yZW1vdmluZykge1xuICAgICAgICAgICAgdmFsdWUgPSBwcm9wLnBhcnRpY2xlLmdldFBvc2l0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzVHJhbnNsYXRlICYmIHRoaXMuX2xvY2tEaXJlY3Rpb24gIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9sb2NrVHJhbnNpdGlvbmFibGUuZ2V0KCkgPT09IDEpIHtcbiAgICAgICAgICAgIGltbWVkaWF0ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcHJvcC5lbmRTdGF0ZS54ID0gdmFsdWVbMF07XG4gICAgICAgIHByb3AuZW5kU3RhdGUueSA9IHZhbHVlLmxlbmd0aCA+IDEgPyB2YWx1ZVsxXSA6IDA7XG4gICAgICAgIHByb3AuZW5kU3RhdGUueiA9IHZhbHVlLmxlbmd0aCA+IDIgPyB2YWx1ZVsyXSA6IDA7XG4gICAgICAgIGlmIChpbW1lZGlhdGUpIHtcbiAgICAgICAgICAgIHByb3AuY3VyU3RhdGUueCA9IHByb3AuZW5kU3RhdGUueDtcbiAgICAgICAgICAgIHByb3AuY3VyU3RhdGUueSA9IHByb3AuZW5kU3RhdGUueTtcbiAgICAgICAgICAgIHByb3AuY3VyU3RhdGUueiA9IHByb3AuZW5kU3RhdGUuejtcbiAgICAgICAgICAgIHByb3AudmVsb2NpdHkueCA9IDA7XG4gICAgICAgICAgICBwcm9wLnZlbG9jaXR5LnkgPSAwO1xuICAgICAgICAgICAgcHJvcC52ZWxvY2l0eS56ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9wLmVuZFN0YXRlLnggIT09IHByb3AuY3VyU3RhdGUueCB8fCBwcm9wLmVuZFN0YXRlLnkgIT09IHByb3AuY3VyU3RhdGUueSB8fCBwcm9wLmVuZFN0YXRlLnogIT09IHByb3AuY3VyU3RhdGUueikge1xuICAgICAgICAgICAgdGhpcy5fcGUud2FrZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgd2FzU2xlZXBpbmcgPSB0aGlzLl9wZS5pc1NsZWVwaW5nKCk7XG4gICAgICAgIGlmICghcHJvcCkge1xuICAgICAgICAgICAgcHJvcCA9IHtcbiAgICAgICAgICAgICAgICBwYXJ0aWNsZTogbmV3IFBhcnRpY2xlKHsgcG9zaXRpb246IHRoaXMuX2luaXRpYWwgfHwgaW1tZWRpYXRlID8gZW5kU3RhdGUgOiBkZWZhdWx0VmFsdWUgfSksXG4gICAgICAgICAgICAgICAgZW5kU3RhdGU6IG5ldyBWZWN0b3IoZW5kU3RhdGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcHJvcC5jdXJTdGF0ZSA9IHByb3AucGFydGljbGUucG9zaXRpb247XG4gICAgICAgICAgICBwcm9wLnZlbG9jaXR5ID0gcHJvcC5wYXJ0aWNsZS52ZWxvY2l0eTtcbiAgICAgICAgICAgIHByb3AuZm9yY2UgPSBuZXcgU3ByaW5nKHRoaXMub3B0aW9ucy5zcHJpbmcpO1xuICAgICAgICAgICAgcHJvcC5mb3JjZS5zZXRPcHRpb25zKHsgYW5jaG9yOiBwcm9wLmVuZFN0YXRlIH0pO1xuICAgICAgICAgICAgdGhpcy5fcGUuYWRkQm9keShwcm9wLnBhcnRpY2xlKTtcbiAgICAgICAgICAgIHByb3AuZm9yY2VJZCA9IHRoaXMuX3BlLmF0dGFjaChwcm9wLmZvcmNlLCBwcm9wLnBhcnRpY2xlKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BlcnRpZXNbcHJvcE5hbWVdID0gcHJvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb3AucGFydGljbGUuc2V0UG9zaXRpb24odGhpcy5faW5pdGlhbCB8fCBpbW1lZGlhdGUgPyBlbmRTdGF0ZSA6IGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgICAgICBwcm9wLmVuZFN0YXRlLnNldChlbmRTdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9pbml0aWFsICYmICFpbW1lZGlhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3BlLndha2UoKTtcbiAgICAgICAgfSBlbHNlIGlmICh3YXNTbGVlcGluZykge1xuICAgICAgICAgICAgdGhpcy5fcGUuc2xlZXAoKTtcbiAgICAgICAgfVxuICAgICAgICBwcm9wLmluaXQgPSB0cnVlO1xuICAgICAgICBwcm9wLmludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBfZ2V0SWZORTJEKGExLCBhMikge1xuICAgIHJldHVybiBhMVswXSA9PT0gYTJbMF0gJiYgYTFbMV0gPT09IGEyWzFdID8gdW5kZWZpbmVkIDogYTE7XG59XG5mdW5jdGlvbiBfZ2V0SWZORTNEKGExLCBhMikge1xuICAgIHJldHVybiBhMVswXSA9PT0gYTJbMF0gJiYgYTFbMV0gPT09IGEyWzFdICYmIGExWzJdID09PSBhMlsyXSA/IHVuZGVmaW5lZCA6IGExO1xufVxuRmxvd0xheW91dE5vZGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChzZXQsIGRlZmF1bHRTaXplKSB7XG4gICAgaWYgKGRlZmF1bHRTaXplKSB7XG4gICAgICAgIHRoaXMuX3JlbW92aW5nID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuX2ludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICB0aGlzLnNjcm9sbExlbmd0aCA9IHNldC5zY3JvbGxMZW5ndGg7XG4gICAgdGhpcy5fc3BlY01vZGlmaWVkID0gdHJ1ZTtcbiAgICB2YXIgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMub3BhY2l0eTtcbiAgICB2YXIgdmFsdWUgPSBzZXQub3BhY2l0eSA9PT0gREVGQVVMVC5vcGFjaXR5ID8gdW5kZWZpbmVkIDogc2V0Lm9wYWNpdHk7XG4gICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAnb3BhY2l0eScsIHZhbHVlID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBbXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSwgREVGQVVMVC5vcGFjaXR5MkQpO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5hbGlnbjtcbiAgICB2YWx1ZSA9IHNldC5hbGlnbiA/IF9nZXRJZk5FMkQoc2V0LmFsaWduLCBERUZBVUxULmFsaWduKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodmFsdWUgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAnYWxpZ24nLCB2YWx1ZSwgREVGQVVMVC5hbGlnbik7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLm9yaWdpbjtcbiAgICB2YWx1ZSA9IHNldC5vcmlnaW4gPyBfZ2V0SWZORTJEKHNldC5vcmlnaW4sIERFRkFVTFQub3JpZ2luKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodmFsdWUgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAnb3JpZ2luJywgdmFsdWUsIERFRkFVTFQub3JpZ2luKTtcbiAgICB9XG4gICAgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMuc2l6ZTtcbiAgICB2YWx1ZSA9IHNldC5zaXplIHx8IGRlZmF1bHRTaXplO1xuICAgIGlmICh2YWx1ZSB8fCBwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBfc2V0UHJvcGVydHlWYWx1ZS5jYWxsKHRoaXMsIHByb3AsICdzaXplJywgdmFsdWUsIGRlZmF1bHRTaXplLCB0aGlzLnVzZXNUcnVlU2l6ZSk7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLnRyYW5zbGF0ZTtcbiAgICB2YWx1ZSA9IHNldC50cmFuc2xhdGU7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3RyYW5zbGF0ZScsIHZhbHVlLCBERUZBVUxULnRyYW5zbGF0ZSwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICB9XG4gICAgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMuc2NhbGU7XG4gICAgdmFsdWUgPSBzZXQuc2NhbGUgPyBfZ2V0SWZORTNEKHNldC5zY2FsZSwgREVGQVVMVC5zY2FsZSkgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3NjYWxlJywgdmFsdWUsIERFRkFVTFQuc2NhbGUpO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5yb3RhdGU7XG4gICAgdmFsdWUgPSBzZXQucm90YXRlID8gX2dldElmTkUzRChzZXQucm90YXRlLCBERUZBVUxULnJvdGF0ZSkgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3JvdGF0ZScsIHZhbHVlLCBERUZBVUxULnJvdGF0ZSk7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLnNrZXc7XG4gICAgdmFsdWUgPSBzZXQuc2tldyA/IF9nZXRJZk5FM0Qoc2V0LnNrZXcsIERFRkFVTFQuc2tldykgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3NrZXcnLCB2YWx1ZSwgREVGQVVMVC5za2V3KTtcbiAgICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBGbG93TGF5b3V0Tm9kZTtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsImZ1bmN0aW9uIExheW91dENvbnRleHQobWV0aG9kcykge1xuICAgIGZvciAodmFyIG4gaW4gbWV0aG9kcykge1xuICAgICAgICB0aGlzW25dID0gbWV0aG9kc1tuXTtcbiAgICB9XG59XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5zaXplID0gdW5kZWZpbmVkO1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuZGlyZWN0aW9uID0gdW5kZWZpbmVkO1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuc2Nyb2xsT2Zmc2V0ID0gdW5kZWZpbmVkO1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuc2Nyb2xsU3RhcnQgPSB1bmRlZmluZWQ7XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5zY3JvbGxFbmQgPSB1bmRlZmluZWQ7XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xufTtcbkxheW91dENvbnRleHQucHJvdG90eXBlLnByZXYgPSBmdW5jdGlvbiAoKSB7XG59O1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKG5vZGUpIHtcbn07XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAobm9kZSwgc2V0KSB7XG59O1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUucmVzb2x2ZVNpemUgPSBmdW5jdGlvbiAobm9kZSkge1xufTtcbm1vZHVsZS5leHBvcnRzID0gTGF5b3V0Q29udGV4dDsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgVXRpbGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IG51bGw7XG52YXIgRW50aXR5ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuRW50aXR5IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuRW50aXR5IDogbnVsbDtcbnZhciBWaWV3U2VxdWVuY2UgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuY29yZS5WaWV3U2VxdWVuY2UgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5WaWV3U2VxdWVuY2UgOiBudWxsO1xudmFyIE9wdGlvbnNNYW5hZ2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuT3B0aW9uc01hbmFnZXIgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5PcHRpb25zTWFuYWdlciA6IG51bGw7XG52YXIgRXZlbnRIYW5kbGVyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuRXZlbnRIYW5kbGVyIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuRXZlbnRIYW5kbGVyIDogbnVsbDtcbnZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgTGF5b3V0Tm9kZU1hbmFnZXIgPSByZXF1aXJlKCcuL0xheW91dE5vZGVNYW5hZ2VyJyk7XG52YXIgTGF5b3V0Tm9kZSA9IHJlcXVpcmUoJy4vTGF5b3V0Tm9kZScpO1xudmFyIEZsb3dMYXlvdXROb2RlID0gcmVxdWlyZSgnLi9GbG93TGF5b3V0Tm9kZScpO1xudmFyIFRyYW5zZm9ybSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IG51bGw7XG5yZXF1aXJlKCcuL2hlbHBlcnMvTGF5b3V0RG9ja0hlbHBlcicpO1xuZnVuY3Rpb24gTGF5b3V0Q29udHJvbGxlcihvcHRpb25zLCBub2RlTWFuYWdlcikge1xuICAgIHRoaXMuaWQgPSBFbnRpdHkucmVnaXN0ZXIodGhpcyk7XG4gICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fY29udGV4dFNpemVDYWNoZSA9IFtcbiAgICAgICAgMCxcbiAgICAgICAgMFxuICAgIF07XG4gICAgdGhpcy5fY29tbWl0T3V0cHV0ID0ge307XG4gICAgdGhpcy5fZXZlbnRJbnB1dCA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbiAgICBFdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKHRoaXMsIHRoaXMuX2V2ZW50SW5wdXQpO1xuICAgIHRoaXMuX2V2ZW50T3V0cHV0ID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuICAgIEV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKHRoaXMsIHRoaXMuX2V2ZW50T3V0cHV0KTtcbiAgICB0aGlzLl9sYXlvdXQgPSB7IG9wdGlvbnM6IE9iamVjdC5jcmVhdGUoe30pIH07XG4gICAgdGhpcy5fbGF5b3V0Lm9wdGlvbnNNYW5hZ2VyID0gbmV3IE9wdGlvbnNNYW5hZ2VyKHRoaXMuX2xheW91dC5vcHRpb25zKTtcbiAgICB0aGlzLl9sYXlvdXQub3B0aW9uc01hbmFnZXIub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuY3JlYXRlKExheW91dENvbnRyb2xsZXIuREVGQVVMVF9PUFRJT05TKTtcbiAgICB0aGlzLl9vcHRpb25zTWFuYWdlciA9IG5ldyBPcHRpb25zTWFuYWdlcih0aGlzLm9wdGlvbnMpO1xuICAgIGlmIChub2RlTWFuYWdlcikge1xuICAgICAgICB0aGlzLl9ub2RlcyA9IG5vZGVNYW5hZ2VyO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmZsb3cpIHtcbiAgICAgICAgdGhpcy5fbm9kZXMgPSBuZXcgTGF5b3V0Tm9kZU1hbmFnZXIoRmxvd0xheW91dE5vZGUsIF9pbml0Rmxvd0xheW91dE5vZGUuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbm9kZXMgPSBuZXcgTGF5b3V0Tm9kZU1hbmFnZXIoTGF5b3V0Tm9kZSk7XG4gICAgfVxuICAgIHRoaXMuc2V0RGlyZWN0aW9uKHVuZGVmaW5lZCk7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgIH1cbn1cbkxheW91dENvbnRyb2xsZXIuREVGQVVMVF9PUFRJT05TID0ge1xuICAgIG5vZGVTcHJpbmc6IHtcbiAgICAgICAgZGFtcGluZ1JhdGlvOiAwLjgsXG4gICAgICAgIHBlcmlvZDogMzAwXG4gICAgfSxcbiAgICBhbHdheXNMYXlvdXQ6IGZhbHNlXG59O1xuZnVuY3Rpb24gX2luaXRGbG93TGF5b3V0Tm9kZShub2RlLCBzcGVjKSB7XG4gICAgaWYgKCFzcGVjICYmIHRoaXMub3B0aW9ucy5pbnNlcnRTcGVjKSB7XG4gICAgICAgIG5vZGUuc2V0U3BlYyh0aGlzLm9wdGlvbnMuaW5zZXJ0U3BlYyk7XG4gICAgfVxufVxuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIHNldE9wdGlvbnMob3B0aW9ucykge1xuICAgIHRoaXMuX29wdGlvbnNNYW5hZ2VyLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMuZGF0YVNvdXJjZSkge1xuICAgICAgICB0aGlzLnNldERhdGFTb3VyY2Uob3B0aW9ucy5kYXRhU291cmNlKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMubGF5b3V0IHx8IG9wdGlvbnMubGF5b3V0T3B0aW9ucykge1xuICAgICAgICB0aGlzLnNldExheW91dChvcHRpb25zLmxheW91dCwgb3B0aW9ucy5sYXlvdXRPcHRpb25zKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuZGlyZWN0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5zZXREaXJlY3Rpb24ob3B0aW9ucy5kaXJlY3Rpb24pO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5ub2RlU3ByaW5nICYmIHRoaXMub3B0aW9ucy5mbG93KSB7XG4gICAgICAgIHRoaXMuX25vZGVzLnNldE5vZGVPcHRpb25zKHsgc3ByaW5nOiBvcHRpb25zLm5vZGVTcHJpbmcgfSk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLnByZWFsbG9jYXRlTm9kZXMpIHtcbiAgICAgICAgdGhpcy5fbm9kZXMucHJlYWxsb2NhdGVOb2RlcyhvcHRpb25zLnByZWFsbG9jYXRlTm9kZXMuY291bnQgfHwgMCwgb3B0aW9ucy5wcmVhbGxvY2F0ZU5vZGVzLnNwZWMpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5mdW5jdGlvbiBfZm9yRWFjaFJlbmRlcmFibGUoY2FsbGJhY2spIHtcbiAgICB2YXIgZGF0YVNvdXJjZSA9IHRoaXMuX2RhdGFTb3VyY2U7XG4gICAgaWYgKGRhdGFTb3VyY2UgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGRhdGFTb3VyY2UubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhU291cmNlW2ldKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZGF0YVNvdXJjZSBpbnN0YW5jZW9mIFZpZXdTZXF1ZW5jZSkge1xuICAgICAgICB2YXIgcmVuZGVyYWJsZTtcbiAgICAgICAgd2hpbGUgKGRhdGFTb3VyY2UpIHtcbiAgICAgICAgICAgIHJlbmRlcmFibGUgPSBkYXRhU291cmNlLmdldCgpO1xuICAgICAgICAgICAgaWYgKCFyZW5kZXJhYmxlKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsYmFjayhyZW5kZXJhYmxlKTtcbiAgICAgICAgICAgIGRhdGFTb3VyY2UgPSBkYXRhU291cmNlLmdldE5leHQoKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhU291cmNlKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhU291cmNlW2tleV0pO1xuICAgICAgICB9XG4gICAgfVxufVxuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuc2V0RGF0YVNvdXJjZSA9IGZ1bmN0aW9uIChkYXRhU291cmNlKSB7XG4gICAgdGhpcy5fZGF0YVNvdXJjZSA9IGRhdGFTb3VyY2U7XG4gICAgdGhpcy5fbm9kZXNCeUlkID0gdW5kZWZpbmVkO1xuICAgIGlmIChkYXRhU291cmNlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgdGhpcy5fdmlld1NlcXVlbmNlID0gbmV3IFZpZXdTZXF1ZW5jZShkYXRhU291cmNlKTtcbiAgICB9IGVsc2UgaWYgKGRhdGFTb3VyY2UgaW5zdGFuY2VvZiBWaWV3U2VxdWVuY2UpIHtcbiAgICAgICAgdGhpcy5fdmlld1NlcXVlbmNlID0gZGF0YVNvdXJjZTtcbiAgICB9IGVsc2UgaWYgKGRhdGFTb3VyY2UgaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgdGhpcy5fbm9kZXNCeUlkID0gZGF0YVNvdXJjZTtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvUGlwZUV2ZW50cykge1xuICAgICAgICBfZm9yRWFjaFJlbmRlcmFibGUuY2FsbCh0aGlzLCBmdW5jdGlvbiAocmVuZGVyYWJsZSkge1xuICAgICAgICAgICAgaWYgKHJlbmRlcmFibGUgJiYgcmVuZGVyYWJsZS5waXBlKSB7XG4gICAgICAgICAgICAgICAgcmVuZGVyYWJsZS5waXBlKHRoaXMpO1xuICAgICAgICAgICAgICAgIHJlbmRlcmFibGUucGlwZSh0aGlzLl9ldmVudE91dHB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmdldERhdGFTb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RhdGFTb3VyY2U7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuc2V0TGF5b3V0ID0gZnVuY3Rpb24gKGxheW91dCwgb3B0aW9ucykge1xuICAgIGlmIChsYXlvdXQgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICB0aGlzLl9sYXlvdXQuX2Z1bmN0aW9uID0gbGF5b3V0O1xuICAgICAgICB0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzID0gbGF5b3V0LkNhcGFiaWxpdGllcztcbiAgICAgICAgdGhpcy5fbGF5b3V0LmxpdGVyYWwgPSB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIGlmIChsYXlvdXQgaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgdGhpcy5fbGF5b3V0LmxpdGVyYWwgPSBsYXlvdXQ7XG4gICAgICAgIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIHZhciBoZWxwZXJOYW1lID0gT2JqZWN0LmtleXMobGF5b3V0KVswXTtcbiAgICAgICAgdmFyIEhlbHBlciA9IExheW91dFV0aWxpdHkuZ2V0UmVnaXN0ZXJlZEhlbHBlcihoZWxwZXJOYW1lKTtcbiAgICAgICAgdGhpcy5fbGF5b3V0Ll9mdW5jdGlvbiA9IEhlbHBlciA/IGZ1bmN0aW9uIChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaGVscGVyID0gbmV3IEhlbHBlcihjb250ZXh0LCBvcHRpb25zKTtcbiAgICAgICAgICAgIGhlbHBlci5wYXJzZShsYXlvdXRbaGVscGVyTmFtZV0pO1xuICAgICAgICB9IDogdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2xheW91dC5fZnVuY3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX2xheW91dC5saXRlcmFsID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLnNldExheW91dE9wdGlvbnMob3B0aW9ucyk7XG4gICAgfVxuICAgIHRoaXMuc2V0RGlyZWN0aW9uKHRoaXMuX2NvbmZpZ3VyZWREaXJlY3Rpb24pO1xuICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmdldExheW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fbGF5b3V0LmxpdGVyYWwgfHwgdGhpcy5fbGF5b3V0Ll9mdW5jdGlvbjtcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5zZXRMYXlvdXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB0aGlzLl9sYXlvdXQub3B0aW9uc01hbmFnZXIuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5nZXRMYXlvdXRPcHRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9sYXlvdXQub3B0aW9ucztcbn07XG5mdW5jdGlvbiBfZ2V0QWN0dWFsRGlyZWN0aW9uKGRpcmVjdGlvbikge1xuICAgIGlmICh0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzICYmIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuZGlyZWN0aW9uKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuZGlyZWN0aW9uKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzLmRpcmVjdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzLmRpcmVjdGlvbltpXSA9PT0gZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuZGlyZWN0aW9uWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuZGlyZWN0aW9uO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkaXJlY3Rpb24gPT09IHVuZGVmaW5lZCA/IFV0aWxpdHkuRGlyZWN0aW9uLlkgOiBkaXJlY3Rpb247XG59XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5zZXREaXJlY3Rpb24gPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XG4gICAgdGhpcy5fY29uZmlndXJlZERpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICB2YXIgbmV3RGlyZWN0aW9uID0gX2dldEFjdHVhbERpcmVjdGlvbi5jYWxsKHRoaXMsIGRpcmVjdGlvbik7XG4gICAgaWYgKG5ld0RpcmVjdGlvbiAhPT0gdGhpcy5fZGlyZWN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2RpcmVjdGlvbiA9IG5ld0RpcmVjdGlvbjtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgfVxufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmdldERpcmVjdGlvbiA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICByZXR1cm4gYWN0dWFsID8gdGhpcy5fZGlyZWN0aW9uIDogdGhpcy5fY29uZmlndXJlZERpcmVjdGlvbjtcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5nZXRTcGVjID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBTdHJpbmcgfHwgdHlwZW9mIG5vZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmICghdGhpcy5fbm9kZXNCeUlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSB0aGlzLl9ub2Rlc0J5SWRbbm9kZV07XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2NvbW1pdE91dHB1dC50YXJnZXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNwZWMgPSB0aGlzLl9jb21taXRPdXRwdXQudGFyZ2V0W2ldO1xuICAgICAgICBpZiAoc3BlYy5yZW5kZXJOb2RlID09PSBub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gc3BlYztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnJlZmxvd0xheW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5pbnNlcnQgPSBmdW5jdGlvbiAoaW5kZXhPcklkLCByZW5kZXJhYmxlLCBpbnNlcnRTcGVjKSB7XG4gICAgaWYgKGluZGV4T3JJZCBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2YgaW5kZXhPcklkID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAodGhpcy5fZGF0YVNvdXJjZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9kYXRhU291cmNlID0ge307XG4gICAgICAgICAgICB0aGlzLl9ub2Rlc0J5SWQgPSB0aGlzLl9kYXRhU291cmNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX25vZGVzQnlJZFtpbmRleE9ySWRdID0gcmVuZGVyYWJsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5fZGF0YVNvdXJjZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9kYXRhU291cmNlID0gW107XG4gICAgICAgICAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSBuZXcgVmlld1NlcXVlbmNlKHRoaXMuX2RhdGFTb3VyY2UpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRhU291cmNlID0gdGhpcy5fdmlld1NlcXVlbmNlIHx8IHRoaXMuX2RhdGFTb3VyY2U7XG4gICAgICAgIGlmIChpbmRleE9ySWQgPT09IC0xKSB7XG4gICAgICAgICAgICBkYXRhU291cmNlLnB1c2gocmVuZGVyYWJsZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5kZXhPcklkID09PSAwKSB7XG4gICAgICAgICAgICBkYXRhU291cmNlLnNwbGljZSgwLCAwLCByZW5kZXJhYmxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGFTb3VyY2Uuc3BsaWNlKGluZGV4T3JJZCwgMCwgcmVuZGVyYWJsZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGluc2VydFNwZWMpIHtcbiAgICAgICAgdGhpcy5fbm9kZXMuaW5zZXJ0Tm9kZSh0aGlzLl9ub2Rlcy5jcmVhdGVOb2RlKHJlbmRlcmFibGUsIGluc2VydFNwZWMpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvUGlwZUV2ZW50cyAmJiByZW5kZXJhYmxlICYmIHJlbmRlcmFibGUucGlwZSkge1xuICAgICAgICByZW5kZXJhYmxlLnBpcGUodGhpcyk7XG4gICAgICAgIHJlbmRlcmFibGUucGlwZSh0aGlzLl9ldmVudE91dHB1dCk7XG4gICAgfVxuICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAocmVuZGVyYWJsZSwgaW5zZXJ0U3BlYykge1xuICAgIHJldHVybiB0aGlzLmluc2VydCgtMSwgcmVuZGVyYWJsZSwgaW5zZXJ0U3BlYyk7XG59O1xuZnVuY3Rpb24gX2dldFZpZXdTZXF1ZW5jZUF0SW5kZXgoaW5kZXgpIHtcbiAgICB2YXIgdmlld1NlcXVlbmNlID0gdGhpcy5fdmlld1NlcXVlbmNlO1xuICAgIHZhciBpID0gdmlld1NlcXVlbmNlID8gdmlld1NlcXVlbmNlLmdldEluZGV4KCkgOiBpbmRleDtcbiAgICBpZiAoaW5kZXggPiBpKSB7XG4gICAgICAgIHdoaWxlICh2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgICAgICAgICBpZiAoIXZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpID0gdmlld1NlcXVlbmNlLmdldEluZGV4KCk7XG4gICAgICAgICAgICBpZiAoaSA9PT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpbmRleCA8IGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChpbmRleCA8IGkpIHtcbiAgICAgICAgd2hpbGUgKHZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgdmlld1NlcXVlbmNlID0gdmlld1NlcXVlbmNlLmdldFByZXZpb3VzKCk7XG4gICAgICAgICAgICBpZiAoIXZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpID0gdmlld1NlcXVlbmNlLmdldEluZGV4KCk7XG4gICAgICAgICAgICBpZiAoaSA9PT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpbmRleCA+IGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2aWV3U2VxdWVuY2U7XG59XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5zd2FwID0gZnVuY3Rpb24gKGluZGV4LCBpbmRleDIpIHtcbiAgICBpZiAodGhpcy5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgIF9nZXRWaWV3U2VxdWVuY2VBdEluZGV4LmNhbGwodGhpcywgaW5kZXgpLnN3YXAoX2dldFZpZXdTZXF1ZW5jZUF0SW5kZXguY2FsbCh0aGlzLCBpbmRleDIpKTtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChpbmRleE9ySWQsIHJlbW92ZVNwZWMpIHtcbiAgICB2YXIgcmVuZGVyTm9kZTtcbiAgICBpZiAodGhpcy5fbm9kZXNCeUlkIHx8IGluZGV4T3JJZCBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2YgaW5kZXhPcklkID09PSAnc3RyaW5nJykge1xuICAgICAgICByZW5kZXJOb2RlID0gdGhpcy5fbm9kZXNCeUlkW2luZGV4T3JJZF07XG4gICAgICAgIGlmIChyZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fbm9kZXNCeUlkW2luZGV4T3JJZF07XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICByZW5kZXJOb2RlID0gdGhpcy5fZGF0YVNvdXJjZS5zcGxpY2UoaW5kZXhPcklkLCAxKVswXTtcbiAgICB9XG4gICAgaWYgKHJlbmRlck5vZGUgJiYgcmVtb3ZlU3BlYykge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuX25vZGVzLmdldE5vZGVCeVJlbmRlck5vZGUocmVuZGVyTm9kZSk7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZShyZW1vdmVTcGVjIHx8IHRoaXMub3B0aW9ucy5yZW1vdmVTcGVjKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAocmVuZGVyTm9kZSkge1xuICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUucmVtb3ZlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9ub2Rlc0J5SWQpIHtcbiAgICAgICAgdmFyIGRpcnR5ID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9ub2Rlc0J5SWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ub2Rlc0J5SWRba2V5XTtcbiAgICAgICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGlydHkpIHtcbiAgICAgICAgICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLl9kYXRhU291cmNlKSB7XG4gICAgICAgIHRoaXMuc2V0RGF0YVNvdXJjZShbXSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmdldFNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5zaXplO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICByZXR1cm4gdGhpcy5pZDtcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5jb21taXQgPSBmdW5jdGlvbiBjb21taXQoY29udGV4dCkge1xuICAgIHZhciB0cmFuc2Zvcm0gPSBjb250ZXh0LnRyYW5zZm9ybTtcbiAgICB2YXIgb3JpZ2luID0gY29udGV4dC5vcmlnaW47XG4gICAgdmFyIHNpemUgPSBjb250ZXh0LnNpemU7XG4gICAgdmFyIG9wYWNpdHkgPSBjb250ZXh0Lm9wYWNpdHk7XG4gICAgaWYgKHNpemVbMF0gIT09IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMF0gfHwgc2l6ZVsxXSAhPT0gdGhpcy5fY29udGV4dFNpemVDYWNoZVsxXSB8fCB0aGlzLl9pc0RpcnR5IHx8IHRoaXMuX25vZGVzLl90cnVlU2l6ZVJlcXVlc3RlZCB8fCB0aGlzLm9wdGlvbnMuYWx3YXlzTGF5b3V0KSB7XG4gICAgICAgIHZhciBldmVudERhdGEgPSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLFxuICAgICAgICAgICAgICAgIG9sZFNpemU6IHRoaXMuX2NvbnRleHRTaXplQ2FjaGUsXG4gICAgICAgICAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgICAgICAgICBkaXJ0eTogdGhpcy5faXNEaXJ0eSxcbiAgICAgICAgICAgICAgICB0cnVlU2l6ZVJlcXVlc3RlZDogdGhpcy5fbm9kZXMuX3RydWVTaXplUmVxdWVzdGVkXG4gICAgICAgICAgICB9O1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdsYXlvdXRzdGFydCcsIGV2ZW50RGF0YSk7XG4gICAgICAgIHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMF0gPSBzaXplWzBdO1xuICAgICAgICB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzFdID0gc2l6ZVsxXTtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IGZhbHNlO1xuICAgICAgICB2YXIgbGF5b3V0Q29udGV4dCA9IHRoaXMuX25vZGVzLnByZXBhcmVGb3JMYXlvdXQodGhpcy5fdmlld1NlcXVlbmNlLCB0aGlzLl9ub2Rlc0J5SWQsIHtcbiAgICAgICAgICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogdGhpcy5fZGlyZWN0aW9uXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuX2xheW91dC5fZnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX2xheW91dC5fZnVuY3Rpb24obGF5b3V0Q29udGV4dCwgdGhpcy5fbGF5b3V0Lm9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLl9ub2Rlcy5idWlsZFNwZWNBbmREZXN0cm95VW5yZW5kZXJlZE5vZGVzKCk7XG4gICAgICAgIHRoaXMuX2NvbW1pdE91dHB1dC50YXJnZXQgPSByZXN1bHQuc3BlY3M7XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ3JlZmxvdycsIHsgdGFyZ2V0OiB0aGlzIH0pO1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdsYXlvdXRlbmQnLCBldmVudERhdGEpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmZsb3cpIHtcbiAgICAgICAgcmVzdWx0ID0gdGhpcy5fbm9kZXMuYnVpbGRTcGVjQW5kRGVzdHJveVVucmVuZGVyZWROb2RlcygpO1xuICAgICAgICB0aGlzLl9jb21taXRPdXRwdXQudGFyZ2V0ID0gcmVzdWx0LnNwZWNzO1xuICAgICAgICBpZiAocmVzdWx0Lm1vZGlmaWVkKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdyZWZsb3cnLCB7IHRhcmdldDogdGhpcyB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5fY29tbWl0T3V0cHV0LnRhcmdldDtcbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IHRhcmdldC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgdGFyZ2V0W2ldLnRhcmdldCA9IHRhcmdldFtpXS5yZW5kZXJOb2RlLnJlbmRlcigpO1xuICAgIH1cbiAgICBpZiAob3JpZ2luICYmIChvcmlnaW5bMF0gIT09IDAgfHwgb3JpZ2luWzFdICE9PSAwKSkge1xuICAgICAgICB0cmFuc2Zvcm0gPSBUcmFuc2Zvcm0ubW92ZVRoZW4oW1xuICAgICAgICAgICAgLXNpemVbMF0gKiBvcmlnaW5bMF0sXG4gICAgICAgICAgICAtc2l6ZVsxXSAqIG9yaWdpblsxXSxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSwgdHJhbnNmb3JtKTtcbiAgICB9XG4gICAgdGhpcy5fY29tbWl0T3V0cHV0LnNpemUgPSBzaXplO1xuICAgIHRoaXMuX2NvbW1pdE91dHB1dC5vcGFjaXR5ID0gb3BhY2l0eTtcbiAgICB0aGlzLl9jb21taXRPdXRwdXQudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgIHJldHVybiB0aGlzLl9jb21taXRPdXRwdXQ7XG59O1xubW9kdWxlLmV4cG9ydHMgPSBMYXlvdXRDb250cm9sbGVyO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIFRyYW5zZm9ybSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IG51bGw7XG52YXIgTGF5b3V0VXRpbGl0eSA9IHJlcXVpcmUoJy4vTGF5b3V0VXRpbGl0eScpO1xuZnVuY3Rpb24gTGF5b3V0Tm9kZShyZW5kZXJOb2RlLCBzcGVjKSB7XG4gICAgdGhpcy5yZW5kZXJOb2RlID0gcmVuZGVyTm9kZTtcbiAgICB0aGlzLl9zcGVjID0gc3BlYyA/IExheW91dFV0aWxpdHkuY2xvbmVTcGVjKHNwZWMpIDoge307XG4gICAgdGhpcy5fc3BlYy5yZW5kZXJOb2RlID0gcmVuZGVyTm9kZTtcbiAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSB0cnVlO1xuICAgIHRoaXMuX2ludmFsaWRhdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fcmVtb3ZpbmcgPSBmYWxzZTtcbn1cbkxheW91dE5vZGUucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xufTtcbkxheW91dE5vZGUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5yZW5kZXJOb2RlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3NwZWMucmVuZGVyTm9kZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSB1bmRlZmluZWQ7XG59O1xuTGF5b3V0Tm9kZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5faW52YWxpZGF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLnRydWVTaXplUmVxdWVzdGVkID0gZmFsc2U7XG59O1xuTGF5b3V0Tm9kZS5wcm90b3R5cGUuc2V0U3BlYyA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gICAgdGhpcy5fc3BlY01vZGlmaWVkID0gdHJ1ZTtcbiAgICBpZiAoc3BlYy5hbGlnbikge1xuICAgICAgICBpZiAoIXNwZWMuYWxpZ24pIHtcbiAgICAgICAgICAgIHRoaXMuX3NwZWMuYWxpZ24gPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NwZWMuYWxpZ25bMF0gPSBzcGVjLmFsaWduWzBdO1xuICAgICAgICB0aGlzLl9zcGVjLmFsaWduWzFdID0gc3BlYy5hbGlnblsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zcGVjLmFsaWduID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoc3BlYy5vcmlnaW4pIHtcbiAgICAgICAgaWYgKCFzcGVjLm9yaWdpbikge1xuICAgICAgICAgICAgdGhpcy5fc3BlYy5vcmlnaW4gPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NwZWMub3JpZ2luWzBdID0gc3BlYy5vcmlnaW5bMF07XG4gICAgICAgIHRoaXMuX3NwZWMub3JpZ2luWzFdID0gc3BlYy5vcmlnaW5bMV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3BlYy5vcmlnaW4gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChzcGVjLnNpemUpIHtcbiAgICAgICAgaWYgKCFzcGVjLnNpemUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NwZWMuc2l6ZSA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3BlYy5zaXplWzBdID0gc3BlYy5zaXplWzBdO1xuICAgICAgICB0aGlzLl9zcGVjLnNpemVbMV0gPSBzcGVjLnNpemVbMV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3BlYy5zaXplID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoc3BlYy50cmFuc2Zvcm0pIHtcbiAgICAgICAgaWYgKCFzcGVjLnRyYW5zZm9ybSkge1xuICAgICAgICAgICAgdGhpcy5fc3BlYy50cmFuc2Zvcm0gPSBzcGVjLnRyYW5zZm9ybS5zbGljZSgwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NwZWMudHJhbnNmb3JtWzBdID0gc3BlYy50cmFuc2Zvcm1bMF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zcGVjLnRyYW5zZm9ybSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdGhpcy5fc3BlYy5vcGFjaXR5ID0gc3BlYy5vcGFjaXR5O1xufTtcbkxheW91dE5vZGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChzZXQsIHNpemUpIHtcbiAgICB0aGlzLl9pbnZhbGlkYXRlZCA9IHRydWU7XG4gICAgdGhpcy5fc3BlY01vZGlmaWVkID0gdHJ1ZTtcbiAgICB0aGlzLl9yZW1vdmluZyA9IGZhbHNlO1xuICAgIHZhciBzcGVjID0gdGhpcy5fc3BlYztcbiAgICBzcGVjLm9wYWNpdHkgPSBzZXQub3BhY2l0eTtcbiAgICBpZiAoc2V0LnNpemUpIHtcbiAgICAgICAgaWYgKCFzcGVjLnNpemUpIHtcbiAgICAgICAgICAgIHNwZWMuc2l6ZSA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgc3BlYy5zaXplWzBdID0gc2V0LnNpemVbMF07XG4gICAgICAgIHNwZWMuc2l6ZVsxXSA9IHNldC5zaXplWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMuc2l6ZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHNldC5vcmlnaW4pIHtcbiAgICAgICAgaWYgKCFzcGVjLm9yaWdpbikge1xuICAgICAgICAgICAgc3BlYy5vcmlnaW4gPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHNwZWMub3JpZ2luWzBdID0gc2V0Lm9yaWdpblswXTtcbiAgICAgICAgc3BlYy5vcmlnaW5bMV0gPSBzZXQub3JpZ2luWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMub3JpZ2luID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoc2V0LmFsaWduKSB7XG4gICAgICAgIGlmICghc3BlYy5hbGlnbikge1xuICAgICAgICAgICAgc3BlYy5hbGlnbiA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgc3BlYy5hbGlnblswXSA9IHNldC5hbGlnblswXTtcbiAgICAgICAgc3BlYy5hbGlnblsxXSA9IHNldC5hbGlnblsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzcGVjLmFsaWduID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoc2V0LnNrZXcgfHwgc2V0LnJvdGF0ZSB8fCBzZXQuc2NhbGUpIHtcbiAgICAgICAgdGhpcy5fc3BlYy50cmFuc2Zvcm0gPSBUcmFuc2Zvcm0uYnVpbGQoe1xuICAgICAgICAgICAgdHJhbnNsYXRlOiBzZXQudHJhbnNsYXRlIHx8IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHNrZXc6IHNldC5za2V3IHx8IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHNjYWxlOiBzZXQuc2NhbGUgfHwgW1xuICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICAxXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcm90YXRlOiBzZXQucm90YXRlIHx8IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHNldC50cmFuc2xhdGUpIHtcbiAgICAgICAgdGhpcy5fc3BlYy50cmFuc2Zvcm0gPSBUcmFuc2Zvcm0udHJhbnNsYXRlKHNldC50cmFuc2xhdGVbMF0sIHNldC50cmFuc2xhdGVbMV0sIHNldC50cmFuc2xhdGVbMl0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3NwZWMudHJhbnNmb3JtID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLnNjcm9sbExlbmd0aCA9IHNldC5zY3JvbGxMZW5ndGg7XG59O1xuTGF5b3V0Tm9kZS5wcm90b3R5cGUuZ2V0U3BlYyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9zcGVjLnJlbW92ZWQgPSAhdGhpcy5faW52YWxpZGF0ZWQ7XG4gICAgcmV0dXJuIHRoaXMuX3NwZWM7XG59O1xuTGF5b3V0Tm9kZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKHJlbW92ZVNwZWMpIHtcbiAgICB0aGlzLl9yZW1vdmluZyA9IHRydWU7XG59O1xubW9kdWxlLmV4cG9ydHMgPSBMYXlvdXROb2RlO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyIExheW91dENvbnRleHQgPSByZXF1aXJlKCcuL0xheW91dENvbnRleHQnKTtcbnZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgTUFYX1BPT0xfU0laRSA9IDEwMDtcbmZ1bmN0aW9uIExheW91dE5vZGVNYW5hZ2VyKExheW91dE5vZGUsIGluaXRMYXlvdXROb2RlRm4pIHtcbiAgICB0aGlzLkxheW91dE5vZGUgPSBMYXlvdXROb2RlO1xuICAgIHRoaXMuX2luaXRMYXlvdXROb2RlRm4gPSBpbml0TGF5b3V0Tm9kZUZuO1xuICAgIHRoaXMuX2xheW91dENvdW50ID0gMDtcbiAgICB0aGlzLl9jb250ZXh0ID0gbmV3IExheW91dENvbnRleHQoe1xuICAgICAgICBuZXh0OiBfY29udGV4dE5leHQuYmluZCh0aGlzKSxcbiAgICAgICAgcHJldjogX2NvbnRleHRQcmV2LmJpbmQodGhpcyksXG4gICAgICAgIGdldDogX2NvbnRleHRHZXQuYmluZCh0aGlzKSxcbiAgICAgICAgc2V0OiBfY29udGV4dFNldC5iaW5kKHRoaXMpLFxuICAgICAgICByZXNvbHZlU2l6ZTogX2NvbnRleHRSZXNvbHZlU2l6ZS5iaW5kKHRoaXMpLFxuICAgICAgICBzaXplOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdXG4gICAgfSk7XG4gICAgdGhpcy5fY29udGV4dFN0YXRlID0ge307XG4gICAgdGhpcy5fcG9vbCA9IHtcbiAgICAgICAgbGF5b3V0Tm9kZXM6IHsgc2l6ZTogMCB9LFxuICAgICAgICByZXNvbHZlU2l6ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXVxuICAgIH07XG59XG5MYXlvdXROb2RlTWFuYWdlci5wcm90b3R5cGUucHJlcGFyZUZvckxheW91dCA9IGZ1bmN0aW9uICh2aWV3U2VxdWVuY2UsIG5vZGVzQnlJZCwgY29udGV4dERhdGEpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX2ZpcnN0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIG5vZGUucmVzZXQoKTtcbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgfVxuICAgIHZhciBjb250ZXh0ID0gdGhpcy5fY29udGV4dDtcbiAgICB0aGlzLl9sYXlvdXRDb3VudCsrO1xuICAgIHRoaXMuX25vZGVzQnlJZCA9IG5vZGVzQnlJZDtcbiAgICB0aGlzLl90cnVlU2l6ZVJlcXVlc3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3JlZXZhbFRydWVTaXplID0gY29udGV4dERhdGEucmVldmFsVHJ1ZVNpemUgfHwgIWNvbnRleHQuc2l6ZSB8fCBjb250ZXh0LnNpemVbMF0gIT09IGNvbnRleHREYXRhLnNpemVbMF0gfHwgY29udGV4dC5zaXplWzFdICE9PSBjb250ZXh0RGF0YS5zaXplWzFdO1xuICAgIHZhciBjb250ZXh0U3RhdGUgPSB0aGlzLl9jb250ZXh0U3RhdGU7XG4gICAgY29udGV4dFN0YXRlLm5leHRTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZTtcbiAgICBjb250ZXh0U3RhdGUucHJldlNlcXVlbmNlID0gdmlld1NlcXVlbmNlO1xuICAgIGNvbnRleHRTdGF0ZS5zdGFydCA9IHVuZGVmaW5lZDtcbiAgICBjb250ZXh0U3RhdGUubmV4dEdldEluZGV4ID0gMDtcbiAgICBjb250ZXh0U3RhdGUucHJldkdldEluZGV4ID0gMDtcbiAgICBjb250ZXh0U3RhdGUubmV4dFNldEluZGV4ID0gMDtcbiAgICBjb250ZXh0U3RhdGUucHJldlNldEluZGV4ID0gMDtcbiAgICBjb250ZXh0U3RhdGUuYWRkQ291bnQgPSAwO1xuICAgIGNvbnRleHRTdGF0ZS5yZW1vdmVDb3VudCA9IDA7XG4gICAgY29udGV4dC5zaXplWzBdID0gY29udGV4dERhdGEuc2l6ZVswXTtcbiAgICBjb250ZXh0LnNpemVbMV0gPSBjb250ZXh0RGF0YS5zaXplWzFdO1xuICAgIGNvbnRleHQuZGlyZWN0aW9uID0gY29udGV4dERhdGEuZGlyZWN0aW9uO1xuICAgIGNvbnRleHQucmV2ZXJzZSA9IGNvbnRleHREYXRhLnJldmVyc2U7XG4gICAgY29udGV4dC5hbGlnbm1lbnQgPSBjb250ZXh0RGF0YS5yZXZlcnNlID8gMSA6IDA7XG4gICAgY29udGV4dC5zY3JvbGxPZmZzZXQgPSBjb250ZXh0RGF0YS5zY3JvbGxPZmZzZXQgfHwgMDtcbiAgICBjb250ZXh0LnNjcm9sbFN0YXJ0ID0gY29udGV4dERhdGEuc2Nyb2xsU3RhcnQgfHwgMDtcbiAgICBjb250ZXh0LnNjcm9sbEVuZCA9IGNvbnRleHREYXRhLnNjcm9sbEVuZCB8fCBjb250ZXh0LnNpemVbY29udGV4dC5kaXJlY3Rpb25dO1xuICAgIHJldHVybiBjb250ZXh0O1xufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5yZW1vdmVOb25JbnZhbGlkYXRlZE5vZGVzID0gZnVuY3Rpb24gKHJlbW92ZVNwZWMpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX2ZpcnN0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQgJiYgIW5vZGUuX3JlbW92aW5nKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZShyZW1vdmVTcGVjKTtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG59O1xuTGF5b3V0Tm9kZU1hbmFnZXIucHJvdG90eXBlLmJ1aWxkU3BlY0FuZERlc3Ryb3lVbnJlbmRlcmVkTm9kZXMgPSBmdW5jdGlvbiAodHJhbnNsYXRlKSB7XG4gICAgdmFyIHNwZWNzID0gW107XG4gICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgICAgIHNwZWNzOiBzcGVjcyxcbiAgICAgICAgICAgIG1vZGlmaWVkOiBmYWxzZVxuICAgICAgICB9O1xuICAgIHZhciBub2RlID0gdGhpcy5fZmlyc3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgdmFyIG1vZGlmaWVkID0gbm9kZS5fc3BlY01vZGlmaWVkO1xuICAgICAgICB2YXIgc3BlYyA9IG5vZGUuZ2V0U3BlYygpO1xuICAgICAgICBpZiAoc3BlYy5yZW1vdmVkKSB7XG4gICAgICAgICAgICB2YXIgZGVzdHJveU5vZGUgPSBub2RlO1xuICAgICAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgICAgICAgICBfZGVzdHJveU5vZGUuY2FsbCh0aGlzLCBkZXN0cm95Tm9kZSk7XG4gICAgICAgICAgICByZXN1bHQubW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG1vZGlmaWVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNwZWMudHJhbnNmb3JtICYmIHRyYW5zbGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBzcGVjLnRyYW5zZm9ybVsxMl0gKz0gdHJhbnNsYXRlWzBdO1xuICAgICAgICAgICAgICAgICAgICBzcGVjLnRyYW5zZm9ybVsxM10gKz0gdHJhbnNsYXRlWzFdO1xuICAgICAgICAgICAgICAgICAgICBzcGVjLnRyYW5zZm9ybVsxNF0gKz0gdHJhbnNsYXRlWzJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQubW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3BlY3MucHVzaChzcGVjKTtcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5hZGRDb3VudCA9IDA7XG4gICAgdGhpcy5fY29udGV4dFN0YXRlLnJlbW92ZUNvdW50ID0gMDtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5nZXROb2RlQnlSZW5kZXJOb2RlID0gZnVuY3Rpb24gKHJlbmRlcmFibGUpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX2ZpcnN0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlLnJlbmRlck5vZGUgPT09IHJlbmRlcmFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5pbnNlcnROb2RlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICBub2RlLl9uZXh0ID0gdGhpcy5fZmlyc3Q7XG4gICAgaWYgKHRoaXMuX2ZpcnN0KSB7XG4gICAgICAgIHRoaXMuX2ZpcnN0Ll9wcmV2ID0gbm9kZTtcbiAgICB9XG4gICAgdGhpcy5fZmlyc3QgPSBub2RlO1xufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5zZXROb2RlT3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdGhpcy5fbm9kZU9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHZhciBub2RlID0gdGhpcy5fZmlyc3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgbm9kZS5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG4gICAgbm9kZSA9IHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuZmlyc3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgbm9kZS5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG59O1xuTGF5b3V0Tm9kZU1hbmFnZXIucHJvdG90eXBlLnByZWFsbG9jYXRlTm9kZXMgPSBmdW5jdGlvbiAoY291bnQsIHNwZWMpIHtcbiAgICB2YXIgbm9kZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgbm9kZXMucHVzaCh0aGlzLmNyZWF0ZU5vZGUodW5kZWZpbmVkLCBzcGVjKSk7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgIF9kZXN0cm95Tm9kZS5jYWxsKHRoaXMsIG5vZGVzW2ldKTtcbiAgICB9XG59O1xuTGF5b3V0Tm9kZU1hbmFnZXIucHJvdG90eXBlLmNyZWF0ZU5vZGUgPSBmdW5jdGlvbiAocmVuZGVyTm9kZSwgc3BlYykge1xuICAgIHZhciBub2RlO1xuICAgIGlmICh0aGlzLl9wb29sLmxheW91dE5vZGVzLmZpcnN0KSB7XG4gICAgICAgIG5vZGUgPSB0aGlzLl9wb29sLmxheW91dE5vZGVzLmZpcnN0O1xuICAgICAgICB0aGlzLl9wb29sLmxheW91dE5vZGVzLmZpcnN0ID0gbm9kZS5fbmV4dDtcbiAgICAgICAgdGhpcy5fcG9vbC5sYXlvdXROb2Rlcy5zaXplLS07XG4gICAgICAgIG5vZGUuY29uc3RydWN0b3IuYXBwbHkobm9kZSwgYXJndW1lbnRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBub2RlID0gbmV3IHRoaXMuTGF5b3V0Tm9kZShyZW5kZXJOb2RlLCBzcGVjKTtcbiAgICAgICAgaWYgKHRoaXMuX25vZGVPcHRpb25zKSB7XG4gICAgICAgICAgICBub2RlLnNldE9wdGlvbnModGhpcy5fbm9kZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG5vZGUuX3ByZXYgPSB1bmRlZmluZWQ7XG4gICAgbm9kZS5fbmV4dCA9IHVuZGVmaW5lZDtcbiAgICBub2RlLl92aWV3U2VxdWVuY2UgPSB1bmRlZmluZWQ7XG4gICAgbm9kZS5fbGF5b3V0Q291bnQgPSAwO1xuICAgIGlmICh0aGlzLl9pbml0TGF5b3V0Tm9kZUZuKSB7XG4gICAgICAgIHRoaXMuX2luaXRMYXlvdXROb2RlRm4uY2FsbCh0aGlzLCBub2RlLCBzcGVjKTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG59O1xuZnVuY3Rpb24gX2Rlc3Ryb3lOb2RlKG5vZGUpIHtcbiAgICBpZiAobm9kZS5fbmV4dCkge1xuICAgICAgICBub2RlLl9uZXh0Ll9wcmV2ID0gbm9kZS5fcHJldjtcbiAgICB9XG4gICAgaWYgKG5vZGUuX3ByZXYpIHtcbiAgICAgICAgbm9kZS5fcHJldi5fbmV4dCA9IG5vZGUuX25leHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZmlyc3QgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICBub2RlLmRlc3Ryb3koKTtcbiAgICBpZiAodGhpcy5fcG9vbC5sYXlvdXROb2Rlcy5zaXplIDwgTUFYX1BPT0xfU0laRSkge1xuICAgICAgICB0aGlzLl9wb29sLmxheW91dE5vZGVzLnNpemUrKztcbiAgICAgICAgbm9kZS5fcHJldiA9IHVuZGVmaW5lZDtcbiAgICAgICAgbm9kZS5fbmV4dCA9IHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuZmlyc3Q7XG4gICAgICAgIHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuZmlyc3QgPSBub2RlO1xuICAgIH1cbn1cbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5nZXRTdGFydEVudW1Ob2RlID0gZnVuY3Rpb24gKG5leHQpIHtcbiAgICBpZiAobmV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maXJzdDtcbiAgICB9IGVsc2UgaWYgKG5leHQgPT09IHRydWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydCAmJiB0aGlzLl9jb250ZXh0U3RhdGUuc3RhcnRQcmV2ID8gdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0Ll9uZXh0IDogdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0O1xuICAgIH0gZWxzZSBpZiAobmV4dCA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydCAmJiAhdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0UHJldiA/IHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydC5fcHJldiA6IHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydDtcbiAgICB9XG59O1xuZnVuY3Rpb24gX2NvbnRleHRHZXRDcmVhdGVBbmRPcmRlck5vZGVzKHJlbmRlck5vZGUsIHByZXYpIHtcbiAgICB2YXIgbm9kZTtcbiAgICB2YXIgc3RhdGUgPSB0aGlzLl9jb250ZXh0U3RhdGU7XG4gICAgaWYgKCFzdGF0ZS5zdGFydCkge1xuICAgICAgICBub2RlID0gdGhpcy5fZmlyc3Q7XG4gICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5yZW5kZXJOb2RlID09PSByZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLmNyZWF0ZU5vZGUocmVuZGVyTm9kZSk7XG4gICAgICAgICAgICBub2RlLl9uZXh0ID0gdGhpcy5fZmlyc3Q7XG4gICAgICAgICAgICBpZiAodGhpcy5fZmlyc3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9maXJzdC5fcHJldiA9IG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9maXJzdCA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuc3RhcnQgPSBub2RlO1xuICAgICAgICBzdGF0ZS5zdGFydFByZXYgPSBwcmV2O1xuICAgICAgICBzdGF0ZS5wcmV2ID0gbm9kZTtcbiAgICAgICAgc3RhdGUubmV4dCA9IG5vZGU7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbiAgICBpZiAocHJldikge1xuICAgICAgICBpZiAoc3RhdGUucHJldi5fcHJldiAmJiBzdGF0ZS5wcmV2Ll9wcmV2LnJlbmRlck5vZGUgPT09IHJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgIHN0YXRlLnByZXYgPSBzdGF0ZS5wcmV2Ll9wcmV2O1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlLnByZXY7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc3RhdGUubmV4dC5fbmV4dCAmJiBzdGF0ZS5uZXh0Ll9uZXh0LnJlbmRlck5vZGUgPT09IHJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgIHN0YXRlLm5leHQgPSBzdGF0ZS5uZXh0Ll9uZXh0O1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlLm5leHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbm9kZSA9IHRoaXMuX2ZpcnN0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlLnJlbmRlck5vZGUgPT09IHJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgbm9kZSA9IHRoaXMuY3JlYXRlTm9kZShyZW5kZXJOb2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobm9kZS5fbmV4dCkge1xuICAgICAgICAgICAgbm9kZS5fbmV4dC5fcHJldiA9IG5vZGUuX3ByZXY7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuX3ByZXYpIHtcbiAgICAgICAgICAgIG5vZGUuX3ByZXYuX25leHQgPSBub2RlLl9uZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZmlyc3QgPSBub2RlLl9uZXh0O1xuICAgICAgICB9XG4gICAgICAgIG5vZGUuX25leHQgPSB1bmRlZmluZWQ7XG4gICAgICAgIG5vZGUuX3ByZXYgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChwcmV2KSB7XG4gICAgICAgIGlmIChzdGF0ZS5wcmV2Ll9wcmV2KSB7XG4gICAgICAgICAgICBub2RlLl9wcmV2ID0gc3RhdGUucHJldi5fcHJldjtcbiAgICAgICAgICAgIHN0YXRlLnByZXYuX3ByZXYuX25leHQgPSBub2RlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZmlyc3QgPSBub2RlO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLnByZXYuX3ByZXYgPSBub2RlO1xuICAgICAgICBub2RlLl9uZXh0ID0gc3RhdGUucHJldjtcbiAgICAgICAgc3RhdGUucHJldiA9IG5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHN0YXRlLm5leHQuX25leHQpIHtcbiAgICAgICAgICAgIG5vZGUuX25leHQgPSBzdGF0ZS5uZXh0Ll9uZXh0O1xuICAgICAgICAgICAgc3RhdGUubmV4dC5fbmV4dC5fcHJldiA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUubmV4dC5fbmV4dCA9IG5vZGU7XG4gICAgICAgIG5vZGUuX3ByZXYgPSBzdGF0ZS5uZXh0O1xuICAgICAgICBzdGF0ZS5uZXh0ID0gbm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG59XG5mdW5jdGlvbiBfY29udGV4dE5leHQoKSB7XG4gICAgaWYgKCF0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9jb250ZXh0LnJldmVyc2UpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXF1ZW5jZSA9IHRoaXMuX2NvbnRleHRTdGF0ZS5uZXh0U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgICAgICBpZiAoIXRoaXMuX2NvbnRleHRTdGF0ZS5uZXh0U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIHJlbmRlck5vZGUgPSB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlLmdldCgpO1xuICAgIGlmICghcmVuZGVyTm9kZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlID0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB2YXIgbmV4dFNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXF1ZW5jZTtcbiAgICBpZiAoIXRoaXMuX2NvbnRleHQucmV2ZXJzZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlck5vZGU6IHJlbmRlck5vZGUsXG4gICAgICAgIHZpZXdTZXF1ZW5jZTogbmV4dFNlcXVlbmNlLFxuICAgICAgICBuZXh0OiB0cnVlLFxuICAgICAgICBpbmRleDogKyt0aGlzLl9jb250ZXh0U3RhdGUubmV4dEdldEluZGV4XG4gICAgfTtcbn1cbmZ1bmN0aW9uIF9jb250ZXh0UHJldigpIHtcbiAgICBpZiAoIXRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2VxdWVuY2UpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9jb250ZXh0LnJldmVyc2UpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZSA9IHRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgaWYgKCF0aGlzLl9jb250ZXh0U3RhdGUucHJldlNlcXVlbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciByZW5kZXJOb2RlID0gdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZS5nZXQoKTtcbiAgICBpZiAoIXJlbmRlck5vZGUpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdmFyIHByZXZTZXF1ZW5jZSA9IHRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2VxdWVuY2U7XG4gICAgaWYgKHRoaXMuX2NvbnRleHQucmV2ZXJzZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByZW5kZXJOb2RlOiByZW5kZXJOb2RlLFxuICAgICAgICB2aWV3U2VxdWVuY2U6IHByZXZTZXF1ZW5jZSxcbiAgICAgICAgcHJldjogdHJ1ZSxcbiAgICAgICAgaW5kZXg6IC0tdGhpcy5fY29udGV4dFN0YXRlLnByZXZHZXRJbmRleFxuICAgIH07XG59XG5mdW5jdGlvbiBfY29udGV4dEdldChjb250ZXh0Tm9kZU9ySWQpIHtcbiAgICBpZiAodGhpcy5fbm9kZXNCeUlkICYmIChjb250ZXh0Tm9kZU9ySWQgaW5zdGFuY2VvZiBTdHJpbmcgfHwgdHlwZW9mIGNvbnRleHROb2RlT3JJZCA9PT0gJ3N0cmluZycpKSB7XG4gICAgICAgIHZhciByZW5kZXJOb2RlID0gdGhpcy5fbm9kZXNCeUlkW2NvbnRleHROb2RlT3JJZF07XG4gICAgICAgIGlmICghcmVuZGVyTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVuZGVyTm9kZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IHJlbmRlck5vZGUubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJOb2RlOiByZW5kZXJOb2RlW2ldLFxuICAgICAgICAgICAgICAgICAgICBhcnJheUVsZW1lbnQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlbmRlck5vZGU6IHJlbmRlck5vZGUsXG4gICAgICAgICAgICBieUlkOiB0cnVlXG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNvbnRleHROb2RlT3JJZDtcbiAgICB9XG59XG5mdW5jdGlvbiBfY29udGV4dFNldChjb250ZXh0Tm9kZU9ySWQsIHNldCkge1xuICAgIHZhciBjb250ZXh0Tm9kZSA9IHRoaXMuX25vZGVzQnlJZCA/IF9jb250ZXh0R2V0LmNhbGwodGhpcywgY29udGV4dE5vZGVPcklkKSA6IGNvbnRleHROb2RlT3JJZDtcbiAgICBpZiAoY29udGV4dE5vZGUpIHtcbiAgICAgICAgdmFyIG5vZGUgPSBjb250ZXh0Tm9kZS5ub2RlO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIGlmIChjb250ZXh0Tm9kZS5uZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRleHROb2RlLmluZGV4IDwgdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXRJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBMYXlvdXRVdGlsaXR5LmVycm9yKCdOb2RlcyBtdXN0IGJlIGxheWVkIG91dCBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IHdlcmUgcmVxdWVzdGVkIScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNldEluZGV4ID0gY29udGV4dE5vZGUuaW5kZXg7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHROb2RlLnByZXYpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29udGV4dE5vZGUuaW5kZXggPiB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNldEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIExheW91dFV0aWxpdHkuZXJyb3IoJ05vZGVzIG11c3QgYmUgbGF5ZWQgb3V0IGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgd2VyZSByZXF1ZXN0ZWQhJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2V0SW5kZXggPSBjb250ZXh0Tm9kZS5pbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBfY29udGV4dEdldENyZWF0ZUFuZE9yZGVyTm9kZXMuY2FsbCh0aGlzLCBjb250ZXh0Tm9kZS5yZW5kZXJOb2RlLCBjb250ZXh0Tm9kZS5wcmV2KTtcbiAgICAgICAgICAgIG5vZGUuX3ZpZXdTZXF1ZW5jZSA9IGNvbnRleHROb2RlLnZpZXdTZXF1ZW5jZTtcbiAgICAgICAgICAgIG5vZGUuX2xheW91dENvdW50Kys7XG4gICAgICAgICAgICBpZiAobm9kZS5fbGF5b3V0Q291bnQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUuYWRkQ291bnQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHROb2RlLm5vZGUgPSBub2RlO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUudXNlc1RydWVTaXplID0gY29udGV4dE5vZGUudXNlc1RydWVTaXplO1xuICAgICAgICBub2RlLnRydWVTaXplUmVxdWVzdGVkID0gY29udGV4dE5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQ7XG4gICAgICAgIG5vZGUuc2V0KHNldCwgdGhpcy5fY29udGV4dC5zaXplKTtcbiAgICAgICAgY29udGV4dE5vZGUuc2V0ID0gc2V0O1xuICAgIH1cbn1cbmZ1bmN0aW9uIF9jb250ZXh0UmVzb2x2ZVNpemUoY29udGV4dE5vZGVPcklkLCBwYXJlbnRTaXplKSB7XG4gICAgdmFyIGNvbnRleHROb2RlID0gdGhpcy5fbm9kZXNCeUlkID8gX2NvbnRleHRHZXQuY2FsbCh0aGlzLCBjb250ZXh0Tm9kZU9ySWQpIDogY29udGV4dE5vZGVPcklkO1xuICAgIHZhciByZXNvbHZlU2l6ZSA9IHRoaXMuX3Bvb2wucmVzb2x2ZVNpemU7XG4gICAgaWYgKCFjb250ZXh0Tm9kZSkge1xuICAgICAgICByZXNvbHZlU2l6ZVswXSA9IDA7XG4gICAgICAgIHJlc29sdmVTaXplWzFdID0gMDtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVTaXplO1xuICAgIH1cbiAgICB2YXIgcmVuZGVyTm9kZSA9IGNvbnRleHROb2RlLnJlbmRlck5vZGU7XG4gICAgdmFyIHNpemUgPSByZW5kZXJOb2RlLmdldFNpemUoKTtcbiAgICBpZiAoIXNpemUpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFNpemU7XG4gICAgfVxuICAgIHZhciBjb25maWdTaXplID0gcmVuZGVyTm9kZS5zaXplICYmIHJlbmRlck5vZGUuX3RydWVTaXplQ2hlY2sgIT09IHVuZGVmaW5lZCA/IHJlbmRlck5vZGUuc2l6ZSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoY29uZmlnU2l6ZSAmJiAoY29uZmlnU2l6ZVswXSA9PT0gdHJ1ZSB8fCBjb25maWdTaXplWzFdID09PSB0cnVlKSkge1xuICAgICAgICBjb250ZXh0Tm9kZS51c2VzVHJ1ZVNpemUgPSB0cnVlO1xuICAgICAgICB2YXIgYmFja3VwU2l6ZSA9IHJlbmRlck5vZGUuX2JhY2t1cFNpemU7XG4gICAgICAgIGlmIChyZW5kZXJOb2RlLl90cnVlU2l6ZUNoZWNrKSB7XG4gICAgICAgICAgICBpZiAoYmFja3VwU2l6ZSAmJiBjb25maWdTaXplICE9PSBzaXplKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld1dpZHRoID0gY29uZmlnU2l6ZVswXSA9PT0gdHJ1ZSA/IE1hdGgubWF4KGJhY2t1cFNpemVbMF0sIHNpemVbMF0pIDogc2l6ZVswXTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3SGVpZ2h0ID0gY29uZmlnU2l6ZVsxXSA9PT0gdHJ1ZSA/IE1hdGgubWF4KGJhY2t1cFNpemVbMV0sIHNpemVbMV0pIDogc2l6ZVsxXTtcbiAgICAgICAgICAgICAgICBpZiAobmV3V2lkdGggIT09IGJhY2t1cFNpemVbMF0gfHwgbmV3SGVpZ2h0ICE9PSBiYWNrdXBTaXplWzFdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3RydWVTaXplUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dE5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBiYWNrdXBTaXplWzBdID0gbmV3V2lkdGg7XG4gICAgICAgICAgICAgICAgYmFja3VwU2l6ZVsxXSA9IG5ld0hlaWdodDtcbiAgICAgICAgICAgICAgICBzaXplID0gYmFja3VwU2l6ZTtcbiAgICAgICAgICAgICAgICByZW5kZXJOb2RlLl9iYWNrdXBTaXplID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGJhY2t1cFNpemUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RydWVTaXplUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb250ZXh0Tm9kZS50cnVlU2l6ZVJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3JlZXZhbFRydWVTaXplKSB7XG4gICAgICAgICAgICByZW5kZXJOb2RlLl90cnVlU2l6ZUNoZWNrID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWJhY2t1cFNpemUpIHtcbiAgICAgICAgICAgIHJlbmRlck5vZGUuX2JhY2t1cFNpemUgPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgYmFja3VwU2l6ZSA9IHJlbmRlck5vZGUuX2JhY2t1cFNpemU7XG4gICAgICAgIH1cbiAgICAgICAgYmFja3VwU2l6ZVswXSA9IHNpemVbMF07XG4gICAgICAgIGJhY2t1cFNpemVbMV0gPSBzaXplWzFdO1xuICAgIH1cbiAgICBpZiAoc2l6ZVswXSA9PT0gdW5kZWZpbmVkIHx8IHNpemVbMF0gPT09IHRydWUgfHwgc2l6ZVsxXSA9PT0gdW5kZWZpbmVkIHx8IHNpemVbMV0gPT09IHRydWUpIHtcbiAgICAgICAgcmVzb2x2ZVNpemVbMF0gPSBzaXplWzBdO1xuICAgICAgICByZXNvbHZlU2l6ZVsxXSA9IHNpemVbMV07XG4gICAgICAgIHNpemUgPSByZXNvbHZlU2l6ZTtcbiAgICAgICAgaWYgKHNpemVbMF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2l6ZVswXSA9IHBhcmVudFNpemVbMF07XG4gICAgICAgIH0gZWxzZSBpZiAoc2l6ZVswXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgc2l6ZVswXSA9IDA7XG4gICAgICAgICAgICB0aGlzLl90cnVlU2l6ZVJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgICAgICBjb250ZXh0Tm9kZS50cnVlU2l6ZVJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNpemVbMV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2l6ZVsxXSA9IHBhcmVudFNpemVbMV07XG4gICAgICAgIH0gZWxzZSBpZiAoc2l6ZVsxXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgc2l6ZVsxXSA9IDA7XG4gICAgICAgICAgICB0aGlzLl90cnVlU2l6ZVJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgICAgICBjb250ZXh0Tm9kZS50cnVlU2l6ZVJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNpemU7XG59XG5tb2R1bGUuZXhwb3J0cyA9IExheW91dE5vZGVNYW5hZ2VyOyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBVdGlsaXR5ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnV0aWxpdGllcy5VdGlsaXR5IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnV0aWxpdGllcy5VdGlsaXR5IDogbnVsbDtcbmZ1bmN0aW9uIExheW91dFV0aWxpdHkoKSB7XG59XG5MYXlvdXRVdGlsaXR5LnJlZ2lzdGVyZWRIZWxwZXJzID0ge307XG52YXIgQ2FwYWJpbGl0aWVzID0ge1xuICAgICAgICBTRVFVRU5DRTogMSxcbiAgICAgICAgRElSRUNUSU9OX1g6IDIsXG4gICAgICAgIERJUkVDVElPTl9ZOiA0LFxuICAgICAgICBTQ1JPTExJTkc6IDhcbiAgICB9O1xuTGF5b3V0VXRpbGl0eS5DYXBhYmlsaXRpZXMgPSBDYXBhYmlsaXRpZXM7XG5MYXlvdXRVdGlsaXR5Lm5vcm1hbGl6ZU1hcmdpbnMgPSBmdW5jdGlvbiAobWFyZ2lucykge1xuICAgIGlmICghbWFyZ2lucykge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdO1xuICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkobWFyZ2lucykpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIG1hcmdpbnMsXG4gICAgICAgICAgICBtYXJnaW5zLFxuICAgICAgICAgICAgbWFyZ2lucyxcbiAgICAgICAgICAgIG1hcmdpbnNcbiAgICAgICAgXTtcbiAgICB9IGVsc2UgaWYgKG1hcmdpbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF07XG4gICAgfSBlbHNlIGlmIChtYXJnaW5zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgbWFyZ2luc1swXSxcbiAgICAgICAgICAgIG1hcmdpbnNbMF0sXG4gICAgICAgICAgICBtYXJnaW5zWzBdLFxuICAgICAgICAgICAgbWFyZ2luc1swXVxuICAgICAgICBdO1xuICAgIH0gZWxzZSBpZiAobWFyZ2lucy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIG1hcmdpbnNbMF0sXG4gICAgICAgICAgICBtYXJnaW5zWzFdLFxuICAgICAgICAgICAgbWFyZ2luc1swXSxcbiAgICAgICAgICAgIG1hcmdpbnNbMV1cbiAgICAgICAgXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbWFyZ2lucztcbiAgICB9XG59O1xuTGF5b3V0VXRpbGl0eS5jbG9uZVNwZWMgPSBmdW5jdGlvbiAoc3BlYykge1xuICAgIHZhciBjbG9uZSA9IHt9O1xuICAgIGlmIChzcGVjLm9wYWNpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjbG9uZS5vcGFjaXR5ID0gc3BlYy5vcGFjaXR5O1xuICAgIH1cbiAgICBpZiAoc3BlYy5zaXplICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY2xvbmUuc2l6ZSA9IHNwZWMuc2l6ZS5zbGljZSgwKTtcbiAgICB9XG4gICAgaWYgKHNwZWMudHJhbnNmb3JtICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY2xvbmUudHJhbnNmb3JtID0gc3BlYy50cmFuc2Zvcm0uc2xpY2UoMCk7XG4gICAgfVxuICAgIGlmIChzcGVjLm9yaWdpbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNsb25lLm9yaWdpbiA9IHNwZWMub3JpZ2luLnNsaWNlKDApO1xuICAgIH1cbiAgICBpZiAoc3BlYy5hbGlnbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNsb25lLmFsaWduID0gc3BlYy5hbGlnbi5zbGljZSgwKTtcbiAgICB9XG4gICAgcmV0dXJuIGNsb25lO1xufTtcbmZ1bmN0aW9uIF9pc0VxdWFsQXJyYXkoYSwgYikge1xuICAgIGlmIChhID09PSBiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoYSA9PT0gdW5kZWZpbmVkIHx8IGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBpID0gYS5sZW5ndGg7XG4gICAgaWYgKGkgIT09IGIubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuTGF5b3V0VXRpbGl0eS5pc0VxdWFsU3BlYyA9IGZ1bmN0aW9uIChzcGVjMSwgc3BlYzIpIHtcbiAgICBpZiAoc3BlYzEub3BhY2l0eSAhPT0gc3BlYzIub3BhY2l0eSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghX2lzRXF1YWxBcnJheShzcGVjMS5zaXplLCBzcGVjMi5zaXplKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghX2lzRXF1YWxBcnJheShzcGVjMS50cmFuc2Zvcm0sIHNwZWMyLnRyYW5zZm9ybSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIV9pc0VxdWFsQXJyYXkoc3BlYzEub3JpZ2luLCBzcGVjMi5vcmlnaW4pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFfaXNFcXVhbEFycmF5KHNwZWMxLmFsaWduLCBzcGVjMi5hbGlnbikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5MYXlvdXRVdGlsaXR5LmdldFNwZWNEaWZmVGV4dCA9IGZ1bmN0aW9uIChzcGVjMSwgc3BlYzIpIHtcbiAgICB2YXIgcmVzdWx0ID0gJ3NwZWMgZGlmZjonO1xuICAgIGlmIChzcGVjMS5vcGFjaXR5ICE9PSBzcGVjMi5vcGFjaXR5KSB7XG4gICAgICAgIHJlc3VsdCArPSAnXFxub3BhY2l0eTogJyArIHNwZWMxLm9wYWNpdHkgKyAnICE9ICcgKyBzcGVjMi5vcGFjaXR5O1xuICAgIH1cbiAgICBpZiAoIV9pc0VxdWFsQXJyYXkoc3BlYzEuc2l6ZSwgc3BlYzIuc2l6ZSkpIHtcbiAgICAgICAgcmVzdWx0ICs9ICdcXG5zaXplOiAnICsgSlNPTi5zdHJpbmdpZnkoc3BlYzEuc2l6ZSkgKyAnICE9ICcgKyBKU09OLnN0cmluZ2lmeShzcGVjMi5zaXplKTtcbiAgICB9XG4gICAgaWYgKCFfaXNFcXVhbEFycmF5KHNwZWMxLnRyYW5zZm9ybSwgc3BlYzIudHJhbnNmb3JtKSkge1xuICAgICAgICByZXN1bHQgKz0gJ1xcbnRyYW5zZm9ybTogJyArIEpTT04uc3RyaW5naWZ5KHNwZWMxLnRyYW5zZm9ybSkgKyAnICE9ICcgKyBKU09OLnN0cmluZ2lmeShzcGVjMi50cmFuc2Zvcm0pO1xuICAgIH1cbiAgICBpZiAoIV9pc0VxdWFsQXJyYXkoc3BlYzEub3JpZ2luLCBzcGVjMi5vcmlnaW4pKSB7XG4gICAgICAgIHJlc3VsdCArPSAnXFxub3JpZ2luOiAnICsgSlNPTi5zdHJpbmdpZnkoc3BlYzEub3JpZ2luKSArICcgIT0gJyArIEpTT04uc3RyaW5naWZ5KHNwZWMyLm9yaWdpbik7XG4gICAgfVxuICAgIGlmICghX2lzRXF1YWxBcnJheShzcGVjMS5hbGlnbiwgc3BlYzIuYWxpZ24pKSB7XG4gICAgICAgIHJlc3VsdCArPSAnXFxuYWxpZ246ICcgKyBKU09OLnN0cmluZ2lmeShzcGVjMS5hbGlnbikgKyAnICE9ICcgKyBKU09OLnN0cmluZ2lmeShzcGVjMi5hbGlnbik7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuTGF5b3V0VXRpbGl0eS5lcnJvciA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgY29uc29sZS5sb2coJ0VSUk9SOiAnICsgbWVzc2FnZSk7XG4gICAgdGhyb3cgbWVzc2FnZTtcbn07XG5MYXlvdXRVdGlsaXR5Lndhcm5pbmcgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIGNvbnNvbGUubG9nKCdXQVJOSU5HOiAnICsgbWVzc2FnZSk7XG59O1xuTGF5b3V0VXRpbGl0eS5sb2cgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHZhciBtZXNzYWdlID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGFyZyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaWYgKGFyZyBpbnN0YW5jZW9mIE9iamVjdCB8fCBhcmcgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgbWVzc2FnZSArPSBKU09OLnN0cmluZ2lmeShhcmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWVzc2FnZSArPSBhcmc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG59O1xuTGF5b3V0VXRpbGl0eS5jb21iaW5lT3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zMSwgb3B0aW9uczIsIGZvcmNlQ2xvbmUpIHtcbiAgICBpZiAob3B0aW9uczEgJiYgIW9wdGlvbnMyICYmICFmb3JjZUNsb25lKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zMTtcbiAgICB9IGVsc2UgaWYgKCFvcHRpb25zMSAmJiBvcHRpb25zMiAmJiAhZm9yY2VDbG9uZSkge1xuICAgICAgICByZXR1cm4gb3B0aW9uczI7XG4gICAgfVxuICAgIHZhciBvcHRpb25zID0gVXRpbGl0eS5jbG9uZShvcHRpb25zMSB8fCB7fSk7XG4gICAgaWYgKG9wdGlvbnMyKSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvcHRpb25zMikge1xuICAgICAgICAgICAgb3B0aW9uc1trZXldID0gb3B0aW9uczJba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3B0aW9ucztcbn07XG5MYXlvdXRVdGlsaXR5LnJlZ2lzdGVySGVscGVyID0gZnVuY3Rpb24gKG5hbWUsIEhlbHBlcikge1xuICAgIGlmICghSGVscGVyLnByb3RvdHlwZS5wYXJzZSkge1xuICAgICAgICBMYXlvdXRVdGlsaXR5LmVycm9yKCdUaGUgbGF5b3V0LWhlbHBlciBmb3IgbmFtZSBcIicgKyBuYW1lICsgJ1wiIGlzIHJlcXVpcmVkIHRvIHN1cHBvcnQgdGhlIFwicGFyc2VcIiBtZXRob2QnKTtcbiAgICB9XG4gICAgaWYgKHRoaXMucmVnaXN0ZXJlZEhlbHBlcnNbbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBMYXlvdXRVdGlsaXR5Lndhcm5pbmcoJ0EgbGF5b3V0LWhlbHBlciB3aXRoIHRoZSBuYW1lIFwiJyArIG5hbWUgKyAnXCIgaXMgYWxyZWFkeSByZWdpc3RlcmVkIGFuZCB3aWxsIGJlIG92ZXJ3cml0dGVuJyk7XG4gICAgfVxuICAgIHRoaXMucmVnaXN0ZXJlZEhlbHBlcnNbbmFtZV0gPSBIZWxwZXI7XG59O1xuTGF5b3V0VXRpbGl0eS51bnJlZ2lzdGVySGVscGVyID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5yZWdpc3RlcmVkSGVscGVyc1tuYW1lXTtcbn07XG5MYXlvdXRVdGlsaXR5LmdldFJlZ2lzdGVyZWRIZWxwZXIgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHJldHVybiB0aGlzLnJlZ2lzdGVyZWRIZWxwZXJzW25hbWVdO1xufTtcbm1vZHVsZS5leHBvcnRzID0gTGF5b3V0VXRpbGl0eTtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgTGF5b3V0Q29udHJvbGxlciA9IHJlcXVpcmUoJy4vTGF5b3V0Q29udHJvbGxlcicpO1xudmFyIExheW91dE5vZGUgPSByZXF1aXJlKCcuL0xheW91dE5vZGUnKTtcbnZhciBGbG93TGF5b3V0Tm9kZSA9IHJlcXVpcmUoJy4vRmxvd0xheW91dE5vZGUnKTtcbnZhciBMYXlvdXROb2RlTWFuYWdlciA9IHJlcXVpcmUoJy4vTGF5b3V0Tm9kZU1hbmFnZXInKTtcbnZhciBDb250YWluZXJTdXJmYWNlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnN1cmZhY2VzLkNvbnRhaW5lclN1cmZhY2UgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuc3VyZmFjZXMuQ29udGFpbmVyU3VyZmFjZSA6IG51bGw7XG52YXIgVHJhbnNmb3JtID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogbnVsbDtcbnZhciBFdmVudEhhbmRsZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuY29yZS5FdmVudEhhbmRsZXIgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5FdmVudEhhbmRsZXIgOiBudWxsO1xudmFyIEdyb3VwID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuR3JvdXAgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5Hcm91cCA6IG51bGw7XG52YXIgVmVjdG9yID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLm1hdGguVmVjdG9yIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLm1hdGguVmVjdG9yIDogbnVsbDtcbnZhciBQaHlzaWNzRW5naW5lID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnBoeXNpY3MuUGh5c2ljc0VuZ2luZSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5waHlzaWNzLlBoeXNpY3NFbmdpbmUgOiBudWxsO1xudmFyIFBhcnRpY2xlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnBoeXNpY3MuYm9kaWVzLlBhcnRpY2xlIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnBoeXNpY3MuYm9kaWVzLlBhcnRpY2xlIDogbnVsbDtcbnZhciBEcmFnID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnBoeXNpY3MuZm9yY2VzLkRyYWcgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMucGh5c2ljcy5mb3JjZXMuRHJhZyA6IG51bGw7XG52YXIgU3ByaW5nID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnBoeXNpY3MuZm9yY2VzLlNwcmluZyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5waHlzaWNzLmZvcmNlcy5TcHJpbmcgOiBudWxsO1xudmFyIFNjcm9sbFN5bmMgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuaW5wdXRzLlNjcm9sbFN5bmMgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuaW5wdXRzLlNjcm9sbFN5bmMgOiBudWxsO1xudmFyIFZpZXdTZXF1ZW5jZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlZpZXdTZXF1ZW5jZSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLlZpZXdTZXF1ZW5jZSA6IG51bGw7XG52YXIgQm91bmRzID0ge1xuICAgICAgICBOT05FOiAwLFxuICAgICAgICBQUkVWOiAxLFxuICAgICAgICBORVhUOiAyLFxuICAgICAgICBCT1RIOiAzXG4gICAgfTtcbnZhciBTcHJpbmdTb3VyY2UgPSB7XG4gICAgICAgIE5PTkU6ICdub25lJyxcbiAgICAgICAgTkVYVEJPVU5EUzogJ25leHQtYm91bmRzJyxcbiAgICAgICAgUFJFVkJPVU5EUzogJ3ByZXYtYm91bmRzJyxcbiAgICAgICAgTUlOU0laRTogJ21pbmltYWwtc2l6ZScsXG4gICAgICAgIEdPVE9TRVFVRU5DRTogJ2dvdG8tc2VxdWVuY2UnLFxuICAgICAgICBFTlNVUkVWSVNJQkxFOiAnZW5zdXJlLXZpc2libGUnLFxuICAgICAgICBHT1RPUFJFVkRJUkVDVElPTjogJ2dvdG8tcHJldi1kaXJlY3Rpb24nLFxuICAgICAgICBHT1RPTkVYVERJUkVDVElPTjogJ2dvdG8tbmV4dC1kaXJlY3Rpb24nLFxuICAgICAgICBTTkFQUFJFVjogJ3NuYXAtcHJldicsXG4gICAgICAgIFNOQVBORVhUOiAnc25hcC1uZXh0J1xuICAgIH07XG5mdW5jdGlvbiBTY3JvbGxDb250cm9sbGVyKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gTGF5b3V0VXRpbGl0eS5jb21iaW5lT3B0aW9ucyhTY3JvbGxDb250cm9sbGVyLkRFRkFVTFRfT1BUSU9OUywgb3B0aW9ucyk7XG4gICAgdmFyIGxheW91dE1hbmFnZXIgPSBuZXcgTGF5b3V0Tm9kZU1hbmFnZXIob3B0aW9ucy5mbG93ID8gRmxvd0xheW91dE5vZGUgOiBMYXlvdXROb2RlLCBfaW5pdExheW91dE5vZGUuYmluZCh0aGlzKSk7XG4gICAgTGF5b3V0Q29udHJvbGxlci5jYWxsKHRoaXMsIG9wdGlvbnMsIGxheW91dE1hbmFnZXIpO1xuICAgIHRoaXMuX3Njcm9sbCA9IHtcbiAgICAgICAgYWN0aXZlVG91Y2hlczogW10sXG4gICAgICAgIHBlOiBuZXcgUGh5c2ljc0VuZ2luZSgpLFxuICAgICAgICBwYXJ0aWNsZTogbmV3IFBhcnRpY2xlKHRoaXMub3B0aW9ucy5zY3JvbGxQYXJ0aWNsZSksXG4gICAgICAgIGRyYWdGb3JjZTogbmV3IERyYWcodGhpcy5vcHRpb25zLnNjcm9sbERyYWcpLFxuICAgICAgICBmcmljdGlvbkZvcmNlOiBuZXcgRHJhZyh0aGlzLm9wdGlvbnMuc2Nyb2xsRnJpY3Rpb24pLFxuICAgICAgICBzcHJpbmdWYWx1ZTogdW5kZWZpbmVkLFxuICAgICAgICBzcHJpbmdGb3JjZTogbmV3IFNwcmluZyh0aGlzLm9wdGlvbnMuc2Nyb2xsU3ByaW5nKSxcbiAgICAgICAgc3ByaW5nRW5kU3RhdGU6IG5ldyBWZWN0b3IoW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0pLFxuICAgICAgICBncm91cFN0YXJ0OiAwLFxuICAgICAgICBncm91cFRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHNjcm9sbERlbHRhOiAwLFxuICAgICAgICBub3JtYWxpemVkU2Nyb2xsRGVsdGE6IDAsXG4gICAgICAgIHNjcm9sbEZvcmNlOiAwLFxuICAgICAgICBzY3JvbGxGb3JjZUNvdW50OiAwLFxuICAgICAgICB1bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQ6IDAsXG4gICAgICAgIGlzU2Nyb2xsaW5nOiBmYWxzZVxuICAgIH07XG4gICAgdGhpcy5fZGVidWcgPSB7XG4gICAgICAgIGxheW91dENvdW50OiAwLFxuICAgICAgICBjb21taXRDb3VudDogMFxuICAgIH07XG4gICAgdGhpcy5ncm91cCA9IG5ldyBHcm91cCgpO1xuICAgIHRoaXMuZ3JvdXAuYWRkKHsgcmVuZGVyOiBfaW5uZXJSZW5kZXIuYmluZCh0aGlzKSB9KTtcbiAgICB0aGlzLl9zY3JvbGwucGUuYWRkQm9keSh0aGlzLl9zY3JvbGwucGFydGljbGUpO1xuICAgIGlmICghdGhpcy5vcHRpb25zLnNjcm9sbERyYWcuZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLmRyYWdGb3JjZUlkID0gdGhpcy5fc2Nyb2xsLnBlLmF0dGFjaCh0aGlzLl9zY3JvbGwuZHJhZ0ZvcmNlLCB0aGlzLl9zY3JvbGwucGFydGljbGUpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5zY3JvbGxGcmljdGlvbi5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLl9zY3JvbGwuZnJpY3Rpb25Gb3JjZUlkID0gdGhpcy5fc2Nyb2xsLnBlLmF0dGFjaCh0aGlzLl9zY3JvbGwuZnJpY3Rpb25Gb3JjZSwgdGhpcy5fc2Nyb2xsLnBhcnRpY2xlKTtcbiAgICB9XG4gICAgdGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlLnNldE9wdGlvbnMoeyBhbmNob3I6IHRoaXMuX3Njcm9sbC5zcHJpbmdFbmRTdGF0ZSB9KTtcbiAgICB0aGlzLl9ldmVudElucHV0Lm9uKCd0b3VjaHN0YXJ0JywgX3RvdWNoU3RhcnQuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5fZXZlbnRJbnB1dC5vbigndG91Y2htb3ZlJywgX3RvdWNoTW92ZS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl9ldmVudElucHV0Lm9uKCd0b3VjaGVuZCcsIF90b3VjaEVuZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl9ldmVudElucHV0Lm9uKCd0b3VjaGNhbmNlbCcsIF90b3VjaEVuZC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl9ldmVudElucHV0Lm9uKCdtb3VzZWRvd24nLCBfbW91c2VEb3duLmJpbmQodGhpcykpO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQub24oJ21vdXNldXAnLCBfbW91c2VVcC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl9ldmVudElucHV0Lm9uKCdtb3VzZW1vdmUnLCBfbW91c2VNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuX3Njcm9sbFN5bmMgPSBuZXcgU2Nyb2xsU3luYyh0aGlzLm9wdGlvbnMuc2Nyb2xsU3luYyk7XG4gICAgdGhpcy5fZXZlbnRJbnB1dC5waXBlKHRoaXMuX3Njcm9sbFN5bmMpO1xuICAgIHRoaXMuX3Njcm9sbFN5bmMub24oJ3VwZGF0ZScsIF9zY3JvbGxVcGRhdGUuYmluZCh0aGlzKSk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy51c2VDb250YWluZXIpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBuZXcgQ29udGFpbmVyU3VyZmFjZSh7IHByb3BlcnRpZXM6IHsgb3ZlcmZsb3c6IHRoaXMub3B0aW9ucy51c2VDb250YWluZXJPdmVyZmxvdyB9IH0pO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGQoe1xuICAgICAgICAgICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgICAgICAgICB9LmJpbmQodGhpcylcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc3Vic2NyaWJlKHRoaXMuY29udGFpbmVyKTtcbiAgICAgICAgRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcih0aGlzLmNvbnRhaW5lciwgdGhpcyk7XG4gICAgICAgIEV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKHRoaXMuY29udGFpbmVyLCB0aGlzKTtcbiAgICB9XG59XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUpO1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTY3JvbGxDb250cm9sbGVyO1xuU2Nyb2xsQ29udHJvbGxlci5Cb3VuZHMgPSBCb3VuZHM7XG5TY3JvbGxDb250cm9sbGVyLkRFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBmbG93OiBmYWxzZSxcbiAgICB1c2VDb250YWluZXI6IGZhbHNlLFxuICAgIHVzZUNvbnRhaW5lck92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICB2aXNpYmxlSXRlbVRocmVzc2hvbGQ6IDAuNSxcbiAgICBzY3JvbGxQYXJ0aWNsZToge30sXG4gICAgc2Nyb2xsRHJhZzoge1xuICAgICAgICBmb3JjZUZ1bmN0aW9uOiBEcmFnLkZPUkNFX0ZVTkNUSU9OUy5RVUFEUkFUSUMsXG4gICAgICAgIHN0cmVuZ3RoOiAwLjAwMSxcbiAgICAgICAgZGlzYWJsZWQ6IHRydWVcbiAgICB9LFxuICAgIHNjcm9sbEZyaWN0aW9uOiB7XG4gICAgICAgIGZvcmNlRnVuY3Rpb246IERyYWcuRk9SQ0VfRlVOQ1RJT05TLkxJTkVBUixcbiAgICAgICAgc3RyZW5ndGg6IDAuMDAyNSxcbiAgICAgICAgZGlzYWJsZWQ6IGZhbHNlXG4gICAgfSxcbiAgICBzY3JvbGxTcHJpbmc6IHtcbiAgICAgICAgZGFtcGluZ1JhdGlvOiAxLFxuICAgICAgICBwZXJpb2Q6IDM1MFxuICAgIH0sXG4gICAgc2Nyb2xsU3luYzogeyBzY2FsZTogMC4yIH0sXG4gICAgcGFnaW5hdGVkOiBmYWxzZSxcbiAgICBwYWdpbmF0aW9uRW5lcmd5VGhyZXNzaG9sZDogMC4wMDUsXG4gICAgYWxpZ25tZW50OiAwLFxuICAgIHRvdWNoTW92ZURpcmVjdGlvblRocmVzc2hvbGQ6IHVuZGVmaW5lZCxcbiAgICBtb3VzZU1vdmU6IGZhbHNlLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgbGF5b3V0QWxsOiBmYWxzZSxcbiAgICBhbHdheXNMYXlvdXQ6IGZhbHNlLFxuICAgIGV4dHJhQm91bmRzU3BhY2U6IFtcbiAgICAgICAgMTAwLFxuICAgICAgICAxMDBcbiAgICBdLFxuICAgIGRlYnVnOiBmYWxzZVxufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIExheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnNldE9wdGlvbnMuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICBpZiAodGhpcy5fc2Nyb2xsKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnNjcm9sbFNwcmluZykge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlLnNldE9wdGlvbnMob3B0aW9ucy5zY3JvbGxTcHJpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLnNjcm9sbERyYWcpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5kcmFnRm9yY2Uuc2V0T3B0aW9ucyhvcHRpb25zLnNjcm9sbERyYWcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChvcHRpb25zLnNjcm9sbFN5bmMgJiYgdGhpcy5fc2Nyb2xsU3luYykge1xuICAgICAgICB0aGlzLl9zY3JvbGxTeW5jLnNldE9wdGlvbnMob3B0aW9ucy5zY3JvbGxTeW5jKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuZnVuY3Rpb24gX2luaXRMYXlvdXROb2RlKG5vZGUsIHNwZWMpIHtcbiAgICBpZiAoIXNwZWMgJiYgdGhpcy5vcHRpb25zLmluc2VydFNwZWMpIHtcbiAgICAgICAgbm9kZS5zZXRTcGVjKHRoaXMub3B0aW9ucy5pbnNlcnRTcGVjKTtcbiAgICB9XG4gICAgaWYgKG5vZGUuc2V0RGlyZWN0aW9uTG9jaykge1xuICAgICAgICBub2RlLnNldERpcmVjdGlvbkxvY2sodGhpcy5fZGlyZWN0aW9uLCAxKTtcbiAgICB9XG59XG5mdW5jdGlvbiBfbG9nKGFyZ3MpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kZWJ1Zykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBtZXNzYWdlID0gdGhpcy5fZGVidWcuY29tbWl0Q291bnQgKyAnOiAnO1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICB2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBpZiAoYXJnIGluc3RhbmNlb2YgT2JqZWN0IHx8IGFyZyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9IEpTT04uc3RyaW5naWZ5KGFyZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9IGFyZztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbn1cbmZ1bmN0aW9uIF91cGRhdGVTcHJpbmcoKSB7XG4gICAgdmFyIHNwcmluZ1ZhbHVlID0gdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQgPyB1bmRlZmluZWQgOiB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb247XG4gICAgaWYgKHRoaXMuX3Njcm9sbC5zcHJpbmdWYWx1ZSAhPT0gc3ByaW5nVmFsdWUpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1ZhbHVlID0gc3ByaW5nVmFsdWU7XG4gICAgICAgIGlmIChzcHJpbmdWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlSWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5wZS5kZXRhY2godGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlSWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdGb3JjZUlkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3Njcm9sbC5zcHJpbmdGb3JjZUlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nRm9yY2VJZCA9IHRoaXMuX3Njcm9sbC5wZS5hdHRhY2godGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlLCB0aGlzLl9zY3JvbGwucGFydGljbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ0VuZFN0YXRlLnNldDFEKHNwcmluZ1ZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5wZS53YWtlKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBfbW91c2VEb3duKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubW91c2VNb3ZlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUpIHtcbiAgICAgICAgdGhpcy5yZWxlYXNlU2Nyb2xsRm9yY2UodGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5kZWx0YSk7XG4gICAgfVxuICAgIHZhciBjdXJyZW50ID0gW1xuICAgICAgICAgICAgZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIGV2ZW50LmNsaWVudFlcbiAgICAgICAgXTtcbiAgICB2YXIgdGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZSA9IHtcbiAgICAgICAgZGVsdGE6IDAsXG4gICAgICAgIHN0YXJ0OiBjdXJyZW50LFxuICAgICAgICBjdXJyZW50OiBjdXJyZW50LFxuICAgICAgICBwcmV2OiBjdXJyZW50LFxuICAgICAgICB0aW1lOiB0aW1lLFxuICAgICAgICBwcmV2VGltZTogdGltZVxuICAgIH07XG4gICAgdGhpcy5hcHBseVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuZGVsdGEpO1xufVxuZnVuY3Rpb24gX21vdXNlTW92ZShldmVudCkge1xuICAgIGlmICghdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZSB8fCAhdGhpcy5vcHRpb25zLmVuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbW92ZURpcmVjdGlvbiA9IE1hdGguYXRhbjIoTWF0aC5hYnMoZXZlbnQuY2xpZW50WSAtIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUucHJldlsxXSksIE1hdGguYWJzKGV2ZW50LmNsaWVudFggLSB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnByZXZbMF0pKSAvIChNYXRoLlBJIC8gMik7XG4gICAgdmFyIGRpcmVjdGlvbkRpZmYgPSBNYXRoLmFicyh0aGlzLl9kaXJlY3Rpb24gLSBtb3ZlRGlyZWN0aW9uKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRvdWNoTW92ZURpcmVjdGlvblRocmVzc2hvbGQgPT09IHVuZGVmaW5lZCB8fCBkaXJlY3Rpb25EaWZmIDw9IHRoaXMub3B0aW9ucy50b3VjaE1vdmVEaXJlY3Rpb25UaHJlc3Nob2xkKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUucHJldiA9IHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuY3VycmVudDtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5jdXJyZW50ID0gW1xuICAgICAgICAgICAgZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgIGV2ZW50LmNsaWVudFlcbiAgICAgICAgXTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5wcmV2VGltZSA9IHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUudGltZTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5kaXJlY3Rpb24gPSBtb3ZlRGlyZWN0aW9uO1xuICAgICAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cbiAgICB2YXIgZGVsdGEgPSB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLmN1cnJlbnRbdGhpcy5fZGlyZWN0aW9uXSAtIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuc3RhcnRbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICB0aGlzLnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuZGVsdGEsIGRlbHRhKTtcbiAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLmRlbHRhID0gZGVsdGE7XG59XG5mdW5jdGlvbiBfbW91c2VVcChldmVudCkge1xuICAgIGlmICghdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB2ZWxvY2l0eSA9IDA7XG4gICAgdmFyIGRpZmZUaW1lID0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS50aW1lIC0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5wcmV2VGltZTtcbiAgICBpZiAoZGlmZlRpbWUgPiAwKSB7XG4gICAgICAgIHZhciBkaWZmT2Zmc2V0ID0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5jdXJyZW50W3RoaXMuX2RpcmVjdGlvbl0gLSB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnByZXZbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICAgICAgdmVsb2NpdHkgPSBkaWZmT2Zmc2V0IC8gZGlmZlRpbWU7XG4gICAgfVxuICAgIHRoaXMucmVsZWFzZVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuZGVsdGEsIHZlbG9jaXR5KTtcbiAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlID0gdW5kZWZpbmVkO1xufVxuZnVuY3Rpb24gX3RvdWNoU3RhcnQoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMuX3RvdWNoRW5kRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl90b3VjaEVuZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuX3RvdWNoRW5kRXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICBfdG91Y2hFbmQuY2FsbCh0aGlzLCBldmVudCk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICB9XG4gICAgdmFyIG9sZFRvdWNoZXNDb3VudCA9IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aDtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGo7XG4gICAgdmFyIHRvdWNoRm91bmQ7XG4gICAgd2hpbGUgKGkgPCB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGFjdGl2ZVRvdWNoID0gdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXNbaV07XG4gICAgICAgIHRvdWNoRm91bmQgPSBmYWxzZTtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGV2ZW50LnRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciB0b3VjaCA9IGV2ZW50LnRvdWNoZXNbal07XG4gICAgICAgICAgICBpZiAodG91Y2guaWRlbnRpZmllciA9PT0gYWN0aXZlVG91Y2guaWQpIHtcbiAgICAgICAgICAgICAgICB0b3VjaEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvdWNoRm91bmQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZXZlbnQudG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhbmdlZFRvdWNoID0gZXZlbnQudG91Y2hlc1tpXTtcbiAgICAgICAgdG91Y2hGb3VuZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlc1tqXS5pZCA9PT0gY2hhbmdlZFRvdWNoLmlkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICB0b3VjaEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvdWNoRm91bmQpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gW1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkVG91Y2guY2xpZW50WCxcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlZFRvdWNoLmNsaWVudFlcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgdmFyIHRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgaWQ6IGNoYW5nZWRUb3VjaC5pZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBjdXJyZW50LFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IGN1cnJlbnQsXG4gICAgICAgICAgICAgICAgcHJldjogY3VycmVudCxcbiAgICAgICAgICAgICAgICB0aW1lOiB0aW1lLFxuICAgICAgICAgICAgICAgIHByZXZUaW1lOiB0aW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNoYW5nZWRUb3VjaC50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl90b3VjaEVuZEV2ZW50TGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghb2xkVG91Y2hlc0NvdW50ICYmIHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmFwcGx5U2Nyb2xsRm9yY2UoMCk7XG4gICAgICAgIHRoaXMuX3Njcm9sbC50b3VjaERlbHRhID0gMDtcbiAgICB9XG59XG5mdW5jdGlvbiBfdG91Y2hNb3ZlKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBwcmltYXJ5VG91Y2g7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhbmdlZFRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbaV07XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciB0b3VjaCA9IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzW2pdO1xuICAgICAgICAgICAgaWYgKHRvdWNoLmlkID09PSBjaGFuZ2VkVG91Y2guaWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgIHZhciBtb3ZlRGlyZWN0aW9uID0gTWF0aC5hdGFuMihNYXRoLmFicyhjaGFuZ2VkVG91Y2guY2xpZW50WSAtIHRvdWNoLnByZXZbMV0pLCBNYXRoLmFicyhjaGFuZ2VkVG91Y2guY2xpZW50WCAtIHRvdWNoLnByZXZbMF0pKSAvIChNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbkRpZmYgPSBNYXRoLmFicyh0aGlzLl9kaXJlY3Rpb24gLSBtb3ZlRGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRvdWNoTW92ZURpcmVjdGlvblRocmVzc2hvbGQgPT09IHVuZGVmaW5lZCB8fCBkaXJlY3Rpb25EaWZmIDw9IHRoaXMub3B0aW9ucy50b3VjaE1vdmVEaXJlY3Rpb25UaHJlc3Nob2xkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoLnByZXYgPSB0b3VjaC5jdXJyZW50O1xuICAgICAgICAgICAgICAgICAgICB0b3VjaC5jdXJyZW50ID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlZFRvdWNoLmNsaWVudFgsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkVG91Y2guY2xpZW50WVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICB0b3VjaC5wcmV2VGltZSA9IHRvdWNoLnRpbWU7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoLmRpcmVjdGlvbiA9IG1vdmVEaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoLnRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICBwcmltYXJ5VG91Y2ggPSBqID09PSAwID8gdG91Y2ggOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChwcmltYXJ5VG91Y2gpIHtcbiAgICAgICAgdmFyIGRlbHRhID0gcHJpbWFyeVRvdWNoLmN1cnJlbnRbdGhpcy5fZGlyZWN0aW9uXSAtIHByaW1hcnlUb3VjaC5zdGFydFt0aGlzLl9kaXJlY3Rpb25dO1xuICAgICAgICB0aGlzLnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC50b3VjaERlbHRhLCBkZWx0YSk7XG4gICAgICAgIHRoaXMuX3Njcm9sbC50b3VjaERlbHRhID0gZGVsdGE7XG4gICAgfVxufVxuZnVuY3Rpb24gX3RvdWNoRW5kKGV2ZW50KSB7XG4gICAgdmFyIHByaW1hcnlUb3VjaCA9IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aCA/IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzWzBdIDogdW5kZWZpbmVkO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoYW5nZWRUb3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzW2ldO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgdG91Y2ggPSB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlc1tqXTtcbiAgICAgICAgICAgIGlmICh0b3VjaC5pZCA9PT0gY2hhbmdlZFRvdWNoLmlkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlcy5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKGogPT09IDAgJiYgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdQcmltYXJ5VG91Y2ggPSB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UHJpbWFyeVRvdWNoLnN0YXJ0WzBdID0gbmV3UHJpbWFyeVRvdWNoLmN1cnJlbnRbMF0gLSAodG91Y2guY3VycmVudFswXSAtIHRvdWNoLnN0YXJ0WzBdKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UHJpbWFyeVRvdWNoLnN0YXJ0WzFdID0gbmV3UHJpbWFyeVRvdWNoLmN1cnJlbnRbMV0gLSAodG91Y2guY3VycmVudFsxXSAtIHRvdWNoLnN0YXJ0WzFdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFwcmltYXJ5VG91Y2ggfHwgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHZlbG9jaXR5ID0gMDtcbiAgICB2YXIgZGlmZlRpbWUgPSBwcmltYXJ5VG91Y2gudGltZSAtIHByaW1hcnlUb3VjaC5wcmV2VGltZTtcbiAgICBpZiAoZGlmZlRpbWUgPiAwKSB7XG4gICAgICAgIHZhciBkaWZmT2Zmc2V0ID0gcHJpbWFyeVRvdWNoLmN1cnJlbnRbdGhpcy5fZGlyZWN0aW9uXSAtIHByaW1hcnlUb3VjaC5wcmV2W3RoaXMuX2RpcmVjdGlvbl07XG4gICAgICAgIHZlbG9jaXR5ID0gZGlmZk9mZnNldCAvIGRpZmZUaW1lO1xuICAgIH1cbiAgICB2YXIgZGVsdGEgPSB0aGlzLl9zY3JvbGwudG91Y2hEZWx0YTtcbiAgICB0aGlzLnJlbGVhc2VTY3JvbGxGb3JjZShkZWx0YSwgdmVsb2NpdHkpO1xuICAgIHRoaXMuX3Njcm9sbC50b3VjaERlbHRhID0gMDtcbn1cbmZ1bmN0aW9uIF9zY3JvbGxVcGRhdGUoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5lbmFibGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG9mZnNldCA9IEFycmF5LmlzQXJyYXkoZXZlbnQuZGVsdGEpID8gZXZlbnQuZGVsdGFbdGhpcy5fZGlyZWN0aW9uXSA6IGV2ZW50LmRlbHRhO1xuICAgIHRoaXMuc2Nyb2xsKG9mZnNldCk7XG59XG5mdW5jdGlvbiBfc2V0UGFydGljbGUocG9zaXRpb24sIHZlbG9jaXR5LCBwaGFzZSkge1xuICAgIGlmIChwb3NpdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZVZhbHVlID0gcG9zaXRpb247XG4gICAgICAgIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZS5zZXRQb3NpdGlvbjFEKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgaWYgKHZlbG9jaXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIG9sZFZlbG9jaXR5ID0gdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLmdldFZlbG9jaXR5MUQoKTtcbiAgICAgICAgaWYgKG9sZFZlbG9jaXR5ICE9PSB2ZWxvY2l0eSkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLnNldFZlbG9jaXR5MUQodmVsb2NpdHkpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gX2NhbGNTY3JvbGxPZmZzZXQobm9ybWFsaXplLCByZWZyZXNoUGFydGljbGUpIHtcbiAgICBpZiAocmVmcmVzaFBhcnRpY2xlIHx8IHRoaXMuX3Njcm9sbC5wYXJ0aWNsZVZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnBhcnRpY2xlVmFsdWUgPSB0aGlzLl9zY3JvbGwucGFydGljbGUuZ2V0UG9zaXRpb24xRCgpO1xuICAgICAgICB0aGlzLl9zY3JvbGwucGFydGljbGVWYWx1ZSA9IE1hdGgucm91bmQodGhpcy5fc2Nyb2xsLnBhcnRpY2xlVmFsdWUgKiAxMDAwKSAvIDEwMDA7XG4gICAgfVxuICAgIHZhciBzY3JvbGxPZmZzZXQgPSB0aGlzLl9zY3JvbGwucGFydGljbGVWYWx1ZTtcbiAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbERlbHRhIHx8IHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGEpIHtcbiAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IHRoaXMuX3Njcm9sbC5zY3JvbGxEZWx0YSArIHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGE7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCAmIEJvdW5kcy5QUkVWICYmIHNjcm9sbE9mZnNldCA+IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiB8fCB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCAmIEJvdW5kcy5ORVhUICYmIHNjcm9sbE9mZnNldCA8IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiB8fCB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9PT0gQm91bmRzLkJPVEgpIHtcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldCA9IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9ybWFsaXplKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3Njcm9sbC5zY3JvbGxEZWx0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGEgPSAwO1xuICAgICAgICAgICAgICAgIF9zZXRQYXJ0aWNsZS5jYWxsKHRoaXMsIHNjcm9sbE9mZnNldCwgdW5kZWZpbmVkLCAnX2NhbGNTY3JvbGxPZmZzZXQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGEgKz0gdGhpcy5fc2Nyb2xsLnNjcm9sbERlbHRhO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNjcm9sbERlbHRhID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQgJiYgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ID0gKHNjcm9sbE9mZnNldCArIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZSArIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbikgLyAyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2Nyb2xsT2Zmc2V0O1xufVxuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuX2NhbGNTY3JvbGxIZWlnaHQgPSBmdW5jdGlvbiAobmV4dCkge1xuICAgIHZhciBjYWxjZWRIZWlnaHQgPSAwO1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZShuZXh0KTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAobm9kZS5faW52YWxpZGF0ZWQpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnRydWVTaXplUmVxdWVzdGVkKSB7XG4gICAgICAgICAgICAgICAgY2FsY2VkSGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vZGUuc2Nyb2xsTGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjYWxjZWRIZWlnaHQgKz0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5leHQgPyBub2RlLl9uZXh0IDogbm9kZS5fcHJldjtcbiAgICB9XG4gICAgcmV0dXJuIGNhbGNlZEhlaWdodDtcbn07XG5mdW5jdGlvbiBfY2FsY0JvdW5kcyhzaXplLCBzY3JvbGxPZmZzZXQpIHtcbiAgICB2YXIgcHJldkhlaWdodCA9IHRoaXMuX2NhbGNTY3JvbGxIZWlnaHQoZmFsc2UpO1xuICAgIHZhciBuZXh0SGVpZ2h0ID0gdGhpcy5fY2FsY1Njcm9sbEhlaWdodCh0cnVlKTtcbiAgICBpZiAocHJldkhlaWdodCA9PT0gdW5kZWZpbmVkIHx8IG5leHRIZWlnaHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5OT05FO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuTk9ORTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdG90YWxIZWlnaHQ7XG4gICAgaWYgKG5leHRIZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBwcmV2SGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdG90YWxIZWlnaHQgPSBwcmV2SGVpZ2h0ICsgbmV4dEhlaWdodDtcbiAgICB9XG4gICAgaWYgKHRvdGFsSGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgdG90YWxIZWlnaHQgPD0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkID0gQm91bmRzLkJPVEg7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPyAtbmV4dEhlaWdodCA6IHByZXZIZWlnaHQ7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuTUlOU0laRTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICBpZiAobmV4dEhlaWdodCAhPT0gdW5kZWZpbmVkICYmIHNjcm9sbE9mZnNldCArIG5leHRIZWlnaHQgPD0gMCkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmJvdW5kc1JlYWNoZWQgPSBCb3VuZHMuTkVYVDtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IC1uZXh0SGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5ORVhUQk9VTkRTO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHByZXZIZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBzY3JvbGxPZmZzZXQgLSBwcmV2SGVpZ2h0ID49IDApIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkID0gQm91bmRzLlBSRVY7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5QUkVWQk9VTkRTO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgIGlmIChwcmV2SGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgc2Nyb2xsT2Zmc2V0IC0gcHJldkhlaWdodCA+PSAtc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5QUkVWO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gLXNpemVbdGhpcy5fZGlyZWN0aW9uXSArIHByZXZIZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLlBSRVZCT1VORFM7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobmV4dEhlaWdodCAhPT0gdW5kZWZpbmVkICYmIHNjcm9sbE9mZnNldCArIG5leHRIZWlnaHQgPD0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5ORVhUO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dIC0gbmV4dEhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuTkVYVEJPVU5EUztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5OT05FO1xuICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLk5PTkU7XG59XG5mdW5jdGlvbiBfY2FsY1Njcm9sbFRvT2Zmc2V0KHNpemUsIHNjcm9sbE9mZnNldCkge1xuICAgIHZhciBzY3JvbGxUb1NlcXVlbmNlID0gdGhpcy5fc2Nyb2xsLnNjcm9sbFRvU2VxdWVuY2UgfHwgdGhpcy5fc2Nyb2xsLmVuc3VyZVZpc2libGVTZXF1ZW5jZTtcbiAgICBpZiAoIXNjcm9sbFRvU2VxdWVuY2UpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2Nyb2xsLmJvdW5kc1JlYWNoZWQgPT09IEJvdW5kcy5CT1RIIHx8ICF0aGlzLl9zY3JvbGwuc2Nyb2xsVG9EaXJlY3Rpb24gJiYgdGhpcy5fc2Nyb2xsLmJvdW5kc1JlYWNoZWQgPT09IEJvdW5kcy5QUkVWIHx8IHRoaXMuX3Njcm9sbC5zY3JvbGxUb0RpcmVjdGlvbiAmJiB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9PT0gQm91bmRzLk5FWFQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZm91bmROb2RlO1xuICAgIHZhciBzY3JvbGxUb09mZnNldCA9IDA7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKHRydWUpO1xuICAgIHZhciBjb3VudCA9IDA7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgY291bnQrKztcbiAgICAgICAgaWYgKCFub2RlLl9pbnZhbGlkYXRlZCB8fCBub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgc2Nyb2xsVG9PZmZzZXQgLT0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuX3ZpZXdTZXF1ZW5jZSA9PT0gc2Nyb2xsVG9TZXF1ZW5jZSkge1xuICAgICAgICAgICAgZm91bmROb2RlID0gbm9kZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgc2Nyb2xsVG9PZmZzZXQgLT0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgfVxuICAgIGlmICghZm91bmROb2RlKSB7XG4gICAgICAgIHNjcm9sbFRvT2Zmc2V0ID0gMDtcbiAgICAgICAgbm9kZSA9IHRoaXMuX25vZGVzLmdldFN0YXJ0RW51bU5vZGUoZmFsc2UpO1xuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgaWYgKCFub2RlLl9pbnZhbGlkYXRlZCB8fCBub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxUb09mZnNldCArPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlLl92aWV3U2VxdWVuY2UgPT09IHNjcm9sbFRvU2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICBmb3VuZE5vZGUgPSBub2RlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxUb09mZnNldCArPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBub2RlLl9wcmV2O1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChmb3VuZE5vZGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3Njcm9sbC5lbnN1cmVWaXNpYmxlU2VxdWVuY2UpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcm9sbFRvT2Zmc2V0IC0gZm91bmROb2RlLnNjcm9sbExlbmd0aCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2Nyb2xsVG9PZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuRU5TVVJFVklTSUJMRTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNjcm9sbFRvT2Zmc2V0ID4gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHNpemVbdGhpcy5fZGlyZWN0aW9uXSAtIHNjcm9sbFRvT2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLkVOU1VSRVZJU0lCTEU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmVuc3VyZVZpc2libGVTZXF1ZW5jZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNjcm9sbFRvT2Zmc2V0ID0gLXNjcm9sbFRvT2Zmc2V0O1xuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxUb09mZnNldCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2Nyb2xsVG9PZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuRU5TVVJFVklTSUJMRTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNjcm9sbFRvT2Zmc2V0ICsgZm91bmROb2RlLnNjcm9sbExlbmd0aCA+IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSBzaXplW3RoaXMuX2RpcmVjdGlvbl0gLSAoc2Nyb2xsVG9PZmZzZXQgKyBmb3VuZE5vZGUuc2Nyb2xsTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5FTlNVUkVWSVNJQkxFO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5lbnN1cmVWaXNpYmxlU2VxdWVuY2UgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2Nyb2xsVG9PZmZzZXQ7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLkdPVE9TRVFVRU5DRTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLl9zY3JvbGwuc2Nyb2xsVG9EaXJlY3Rpb24pIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2Nyb2xsT2Zmc2V0IC0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLkdPVE9QUkVWRElSRUNUSU9OO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHNjcm9sbE9mZnNldCArIHNpemVbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5HT1RPTkVYVERJUkVDVElPTjtcbiAgICB9XG59XG5mdW5jdGlvbiBfc25hcFRvUGFnZShzaXplLCBzY3JvbGxPZmZzZXQpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5wYWdpbmF0ZWQgfHwgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQgfHwgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcGFnZU9mZnNldCA9IHNjcm9sbE9mZnNldDtcbiAgICB2YXIgcGFnZUxlbmd0aDtcbiAgICB2YXIgaGFzTmV4dDtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX25vZGVzLmdldFN0YXJ0RW51bU5vZGUoZmFsc2UpO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLnNjcm9sbExlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgaWYgKHBhZ2VPZmZzZXQgPD0gMCB8fCBub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBoYXNOZXh0ID0gcGFnZUxlbmd0aCAhPT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgcGFnZUxlbmd0aCA9IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgcGFnZU9mZnNldCAtPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fcHJldjtcbiAgICB9XG4gICAgaWYgKHBhZ2VMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSh0cnVlKTtcbiAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlLnNjcm9sbExlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBoYXNOZXh0ID0gcGFnZUxlbmd0aCAhPT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGlmIChoYXNOZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYWdlT2Zmc2V0ICsgcGFnZUxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHBhZ2VPZmZzZXQgKz0gcGFnZUxlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFnZUxlbmd0aCA9IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFwYWdlTGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGZsaXBUb1ByZXY7XG4gICAgdmFyIGZsaXBUb05leHQ7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uRW5lcmd5VGhyZXNzaG9sZCAmJiBNYXRoLmFicyh0aGlzLl9zY3JvbGwucGFydGljbGUuZ2V0RW5lcmd5KCkpID49IHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uRW5lcmd5VGhyZXNzaG9sZCkge1xuICAgICAgICB2YXIgdmVsb2NpdHkgPSB0aGlzLl9zY3JvbGwucGFydGljbGUuZ2V0VmVsb2NpdHkxRCgpO1xuICAgICAgICBmbGlwVG9QcmV2ID0gdmVsb2NpdHkgPiAwO1xuICAgICAgICBmbGlwVG9OZXh0ID0gdmVsb2NpdHkgPCAwO1xuICAgIH1cbiAgICB2YXIgYm91bmRPZmZzZXQgPSBwYWdlT2Zmc2V0O1xuICAgIHZhciBzbmFwU3ByaW5nUG9zaXRpb247XG4gICAgaWYgKCFoYXNOZXh0IHx8IGZsaXBUb1ByZXYgfHwgIWZsaXBUb05leHQgJiYgTWF0aC5hYnMoYm91bmRPZmZzZXQpIDwgTWF0aC5hYnMoYm91bmRPZmZzZXQgKyBwYWdlTGVuZ3RoKSkge1xuICAgICAgICBzbmFwU3ByaW5nUG9zaXRpb24gPSBzY3JvbGxPZmZzZXQgLSBwYWdlT2Zmc2V0IC0gKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPyBwYWdlTGVuZ3RoIDogMCk7XG4gICAgICAgIGlmIChzbmFwU3ByaW5nUG9zaXRpb24gIT09IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc25hcFNwcmluZ1Bvc2l0aW9uO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5TTkFQUFJFVjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHNuYXBTcHJpbmdQb3NpdGlvbiA9IHNjcm9sbE9mZnNldCAtIChwYWdlT2Zmc2V0ICsgcGFnZUxlbmd0aCk7XG4gICAgICAgIGlmIChzbmFwU3ByaW5nUG9zaXRpb24gIT09IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc25hcFNwcmluZ1Bvc2l0aW9uO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5TTkFQTkVYVDtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIF9ub3JtYWxpemVQcmV2Vmlld1NlcXVlbmNlKHNpemUsIHNjcm9sbE9mZnNldCkge1xuICAgIHZhciBjb3VudCA9IDA7XG4gICAgdmFyIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQ7XG4gICAgdmFyIG5vcm1hbGl6ZU5leHRQcmV2ID0gZmFsc2U7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKGZhbHNlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkIHx8ICFub2RlLl92aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub3JtYWxpemVOZXh0UHJldikge1xuICAgICAgICAgICAgdGhpcy5fdmlld1NlcXVlbmNlID0gbm9kZS5fdmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IHNjcm9sbE9mZnNldDtcbiAgICAgICAgICAgIG5vcm1hbGl6ZU5leHRQcmV2ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuc2Nyb2xsTGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbm9kZS50cnVlU2l6ZVJlcXVlc3RlZCB8fCBzY3JvbGxPZmZzZXQgPCAwKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBzY3JvbGxPZmZzZXQgLT0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgIGNvdW50Kys7XG4gICAgICAgIGlmIChub2RlLnNjcm9sbExlbmd0aCkge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICBub3JtYWxpemVOZXh0UHJldiA9IHNjcm9sbE9mZnNldCA+PSAwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSBub2RlLl92aWV3U2VxdWVuY2U7XG4gICAgICAgICAgICAgICAgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IHNjcm9sbE9mZnNldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fcHJldjtcbiAgICB9XG4gICAgcmV0dXJuIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQ7XG59XG5mdW5jdGlvbiBfbm9ybWFsaXplTmV4dFZpZXdTZXF1ZW5jZShzaXplLCBzY3JvbGxPZmZzZXQpIHtcbiAgICB2YXIgY291bnQgPSAwO1xuICAgIHZhciBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0O1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSh0cnVlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkIHx8IG5vZGUuc2Nyb2xsTGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbm9kZS50cnVlU2l6ZVJlcXVlc3RlZCB8fCAhbm9kZS5fdmlld1NlcXVlbmNlIHx8IHNjcm9sbE9mZnNldCA+IDAgJiYgKCF0aGlzLm9wdGlvbnMuYWxpZ25tZW50IHx8IG5vZGUuc2Nyb2xsTGVuZ3RoICE9PSAwKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldCArPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuc2Nyb2xsTGVuZ3RoIHx8IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZpZXdTZXF1ZW5jZSA9IG5vZGUuX3ZpZXdTZXF1ZW5jZTtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICBzY3JvbGxPZmZzZXQgKz0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gbm9ybWFsaXplZFNjcm9sbE9mZnNldDtcbn1cbmZ1bmN0aW9uIF9ub3JtYWxpemVWaWV3U2VxdWVuY2Uoc2l6ZSwgc2Nyb2xsT2Zmc2V0KSB7XG4gICAgdmFyIGNhcHMgPSB0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzO1xuICAgIGlmIChjYXBzICYmIGNhcHMuZGVidWcgJiYgY2Fwcy5kZWJ1Zy5ub3JtYWxpemUgIT09IHVuZGVmaW5lZCAmJiAhY2Fwcy5kZWJ1Zy5ub3JtYWxpemUpIHtcbiAgICAgICAgcmV0dXJuIHNjcm9sbE9mZnNldDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZUNvdW50KSB7XG4gICAgICAgIHJldHVybiBzY3JvbGxPZmZzZXQ7XG4gICAgfVxuICAgIHZhciBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0O1xuICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50ICYmIHNjcm9sbE9mZnNldCA8IDApIHtcbiAgICAgICAgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IF9ub3JtYWxpemVOZXh0Vmlld1NlcXVlbmNlLmNhbGwodGhpcywgc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLm9wdGlvbnMuYWxpZ25tZW50ICYmIHNjcm9sbE9mZnNldCA+IDApIHtcbiAgICAgICAgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IF9ub3JtYWxpemVQcmV2Vmlld1NlcXVlbmNlLmNhbGwodGhpcywgc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICB9XG4gICAgaWYgKG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPT09IHNjcm9sbE9mZnNldCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCAmJiBzY3JvbGxPZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gX25vcm1hbGl6ZVByZXZWaWV3U2VxdWVuY2UuY2FsbCh0aGlzLCBzaXplLCBzY3JvbGxPZmZzZXQpO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLm9wdGlvbnMuYWxpZ25tZW50ICYmIHNjcm9sbE9mZnNldCA8IDApIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBfbm9ybWFsaXplTmV4dFZpZXdTZXF1ZW5jZS5jYWxsKHRoaXMsIHNpemUsIHNjcm9sbE9mZnNldCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgIT09IHNjcm9sbE9mZnNldCkge1xuICAgICAgICB2YXIgZGVsdGEgPSBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0IC0gc2Nyb2xsT2Zmc2V0O1xuICAgICAgICB2YXIgcGFydGljbGVWYWx1ZSA9IHRoaXMuX3Njcm9sbC5wYXJ0aWNsZS5nZXRQb3NpdGlvbjFEKCk7XG4gICAgICAgIF9zZXRQYXJ0aWNsZS5jYWxsKHRoaXMsIHBhcnRpY2xlVmFsdWUgKyBkZWx0YSwgdW5kZWZpbmVkLCAnbm9ybWFsaXplJyk7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uICs9IGRlbHRhO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjYXBzICYmIGNhcHMuc2VxdWVudGlhbFNjcm9sbGluZ09wdGltaXplZCkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmdyb3VwU3RhcnQgLT0gZGVsdGE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQ7XG59XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nZXRWaXNpYmxlSXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNpemUgPSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlO1xuICAgIHZhciBzY3JvbGxPZmZzZXQgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID8gdGhpcy5fc2Nyb2xsLnVubm9ybWFsaXplZFNjcm9sbE9mZnNldCArIHNpemVbdGhpcy5fZGlyZWN0aW9uXSA6IHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQ7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSh0cnVlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkIHx8IG5vZGUuc2Nyb2xsTGVuZ3RoID09PSB1bmRlZmluZWQgfHwgc2Nyb2xsT2Zmc2V0ID4gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBzY3JvbGxPZmZzZXQgKz0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgIGlmIChzY3JvbGxPZmZzZXQgPj0gMCkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgIGluZGV4OiBub2RlLl92aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKSxcbiAgICAgICAgICAgICAgICB2aWV3U2VxdWVuY2U6IG5vZGUuX3ZpZXdTZXF1ZW5jZSxcbiAgICAgICAgICAgICAgICByZW5kZXJOb2RlOiBub2RlLnJlbmRlck5vZGUsXG4gICAgICAgICAgICAgICAgdmlzaWJsZVBlcmM6IG5vZGUuc2Nyb2xsTGVuZ3RoID8gKE1hdGgubWluKHNjcm9sbE9mZnNldCwgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSAtIE1hdGgubWF4KHNjcm9sbE9mZnNldCAtIG5vZGUuc2Nyb2xsTGVuZ3RoLCAwKSkgLyBub2RlLnNjcm9sbExlbmd0aCA6IDEsXG4gICAgICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0OiBzY3JvbGxPZmZzZXQgLSBub2RlLnNjcm9sbExlbmd0aCxcbiAgICAgICAgICAgICAgICBzY3JvbGxMZW5ndGg6IG5vZGUuc2Nyb2xsTGVuZ3RoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG4gICAgc2Nyb2xsT2Zmc2V0ID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgKyBzaXplW3RoaXMuX2RpcmVjdGlvbl0gOiB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0O1xuICAgIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKGZhbHNlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkIHx8IG5vZGUuc2Nyb2xsTGVuZ3RoID09PSB1bmRlZmluZWQgfHwgc2Nyb2xsT2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc2Nyb2xsT2Zmc2V0IC09IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICBpZiAoc2Nyb2xsT2Zmc2V0IDwgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICByZXN1bHQudW5zaGlmdCh7XG4gICAgICAgICAgICAgICAgaW5kZXg6IG5vZGUuX3ZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpLFxuICAgICAgICAgICAgICAgIHZpZXdTZXF1ZW5jZTogbm9kZS5fdmlld1NlcXVlbmNlLFxuICAgICAgICAgICAgICAgIHJlbmRlck5vZGU6IG5vZGUucmVuZGVyTm9kZSxcbiAgICAgICAgICAgICAgICB2aXNpYmxlUGVyYzogbm9kZS5zY3JvbGxMZW5ndGggPyAoTWF0aC5taW4oc2Nyb2xsT2Zmc2V0ICsgbm9kZS5zY3JvbGxMZW5ndGgsIHNpemVbdGhpcy5fZGlyZWN0aW9uXSkgLSBNYXRoLm1heChzY3JvbGxPZmZzZXQsIDApKSAvIG5vZGUuc2Nyb2xsTGVuZ3RoIDogMSxcbiAgICAgICAgICAgICAgICBzY3JvbGxPZmZzZXQ6IHNjcm9sbE9mZnNldCxcbiAgICAgICAgICAgICAgICBzY3JvbGxMZW5ndGg6IG5vZGUuc2Nyb2xsTGVuZ3RoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fcHJldjtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nZXRGaXJzdFZpc2libGVJdGVtID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzaXplID0gdGhpcy5fY29udGV4dFNpemVDYWNoZTtcbiAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgKyBzaXplW3RoaXMuX2RpcmVjdGlvbl0gOiB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0O1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSh0cnVlKTtcbiAgICB2YXIgbm9kZUZvdW5kVmlzaWJsZVBlcmM7XG4gICAgdmFyIG5vZGVGb3VuZFNjcm9sbE9mZnNldDtcbiAgICB2YXIgbm9kZUZvdW5kO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQgfHwgbm9kZS5zY3JvbGxMZW5ndGggPT09IHVuZGVmaW5lZCB8fCBzY3JvbGxPZmZzZXQgPiBzaXplW3RoaXMuX2RpcmVjdGlvbl0pIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHNjcm9sbE9mZnNldCArPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgaWYgKHNjcm9sbE9mZnNldCA+PSAwKSB7XG4gICAgICAgICAgICBub2RlRm91bmRWaXNpYmxlUGVyYyA9IG5vZGUuc2Nyb2xsTGVuZ3RoID8gKE1hdGgubWluKHNjcm9sbE9mZnNldCwgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSAtIE1hdGgubWF4KHNjcm9sbE9mZnNldCAtIG5vZGUuc2Nyb2xsTGVuZ3RoLCAwKSkgLyBub2RlLnNjcm9sbExlbmd0aCA6IDE7XG4gICAgICAgICAgICBub2RlRm91bmRTY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQgLSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIGlmIChub2RlRm91bmRWaXNpYmxlUGVyYyA+PSB0aGlzLm9wdGlvbnMudmlzaWJsZUl0ZW1UaHJlc3Nob2xkIHx8IG5vZGVGb3VuZFNjcm9sbE9mZnNldCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgbm9kZUZvdW5kID0gbm9kZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG4gICAgc2Nyb2xsT2Zmc2V0ID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgKyBzaXplW3RoaXMuX2RpcmVjdGlvbl0gOiB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0O1xuICAgIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKGZhbHNlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkIHx8IG5vZGUuc2Nyb2xsTGVuZ3RoID09PSB1bmRlZmluZWQgfHwgc2Nyb2xsT2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc2Nyb2xsT2Zmc2V0IC09IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICBpZiAoc2Nyb2xsT2Zmc2V0IDwgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICB2YXIgdmlzaWJsZVBlcmMgPSBub2RlLnNjcm9sbExlbmd0aCA/IChNYXRoLm1pbihzY3JvbGxPZmZzZXQgKyBub2RlLnNjcm9sbExlbmd0aCwgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSAtIE1hdGgubWF4KHNjcm9sbE9mZnNldCwgMCkpIC8gbm9kZS5zY3JvbGxMZW5ndGggOiAxO1xuICAgICAgICAgICAgaWYgKHZpc2libGVQZXJjID49IHRoaXMub3B0aW9ucy52aXNpYmxlSXRlbVRocmVzc2hvbGQgfHwgc2Nyb2xsT2Zmc2V0ID49IDApIHtcbiAgICAgICAgICAgICAgICBub2RlRm91bmRWaXNpYmxlUGVyYyA9IHZpc2libGVQZXJjO1xuICAgICAgICAgICAgICAgIG5vZGVGb3VuZFNjcm9sbE9mZnNldCA9IHNjcm9sbE9mZnNldDtcbiAgICAgICAgICAgICAgICBub2RlRm91bmQgPSBub2RlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9wcmV2O1xuICAgIH1cbiAgICByZXR1cm4gbm9kZUZvdW5kID8ge1xuICAgICAgICBpbmRleDogbm9kZUZvdW5kLl92aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKSxcbiAgICAgICAgdmlld1NlcXVlbmNlOiBub2RlRm91bmQuX3ZpZXdTZXF1ZW5jZSxcbiAgICAgICAgcmVuZGVyTm9kZTogbm9kZUZvdW5kLnJlbmRlck5vZGUsXG4gICAgICAgIHZpc2libGVQZXJjOiBub2RlRm91bmRWaXNpYmxlUGVyYyxcbiAgICAgICAgc2Nyb2xsT2Zmc2V0OiBub2RlRm91bmRTY3JvbGxPZmZzZXQsXG4gICAgICAgIHNjcm9sbExlbmd0aDogbm9kZUZvdW5kLnNjcm9sbExlbmd0aFxuICAgIH0gOiB1bmRlZmluZWQ7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ2V0TGFzdFZpc2libGVJdGVtID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBpdGVtcyA9IHRoaXMuZ2V0VmlzaWJsZUl0ZW1zKCk7XG4gICAgdmFyIHNpemUgPSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlO1xuICAgIGZvciAodmFyIGkgPSBpdGVtcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICB2YXIgaXRlbSA9IGl0ZW1zW2ldO1xuICAgICAgICBpZiAoaXRlbS52aXNpYmxlUGVyYyA+PSB0aGlzLm9wdGlvbnMudmlzaWJsZUl0ZW1UaHJlc3Nob2xkIHx8IGl0ZW0uc2Nyb2xsT2Zmc2V0ICsgaXRlbS5zY3JvbGxMZW5ndGggPD0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaXRlbXMubGVuZ3RoID8gaXRlbXNbaXRlbXMubGVuZ3RoIC0gMV0gOiB1bmRlZmluZWQ7XG59O1xuZnVuY3Rpb24gX3Njcm9sbFRvU2VxdWVuY2Uodmlld1NlcXVlbmNlLCBuZXh0KSB7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbFRvU2VxdWVuY2UgPSB2aWV3U2VxdWVuY2U7XG4gICAgdGhpcy5fc2Nyb2xsLmVuc3VyZVZpc2libGVTZXF1ZW5jZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9EaXJlY3Rpb24gPSBuZXh0O1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxEaXJ0eSA9IHRydWU7XG59XG5mdW5jdGlvbiBfZW5zdXJlVmlzaWJsZVNlcXVlbmNlKHZpZXdTZXF1ZW5jZSwgbmV4dCkge1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxUb1NlcXVlbmNlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3Njcm9sbC5lbnN1cmVWaXNpYmxlU2VxdWVuY2UgPSB2aWV3U2VxdWVuY2U7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbFRvRGlyZWN0aW9uID0gbmV4dDtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgPSB0cnVlO1xufVxuZnVuY3Rpb24gX2dvVG9QYWdlKGFtb3VudCkge1xuICAgIHZhciB2aWV3U2VxdWVuY2UgPSB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9TZXF1ZW5jZSB8fCB0aGlzLl92aWV3U2VxdWVuY2U7XG4gICAgaWYgKCF0aGlzLl9zY3JvbGwuc2Nyb2xsVG9TZXF1ZW5jZSkge1xuICAgICAgICB2YXIgZmlyc3RWaXNpYmxlSXRlbSA9IHRoaXMuZ2V0Rmlyc3RWaXNpYmxlSXRlbSgpO1xuICAgICAgICBpZiAoZmlyc3RWaXNpYmxlSXRlbSkge1xuICAgICAgICAgICAgdmlld1NlcXVlbmNlID0gZmlyc3RWaXNpYmxlSXRlbS52aWV3U2VxdWVuY2U7XG4gICAgICAgICAgICBpZiAoYW1vdW50IDwgMCAmJiBmaXJzdFZpc2libGVJdGVtLnNjcm9sbE9mZnNldCA8IDAgfHwgYW1vdW50ID4gMCAmJiBmaXJzdFZpc2libGVJdGVtLnNjcm9sbE9mZnNldCA+IDApIHtcbiAgICAgICAgICAgICAgICBhbW91bnQgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghdmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBNYXRoLmFicyhhbW91bnQpOyBpKyspIHtcbiAgICAgICAgdmFyIG5leHRWaWV3U2VxdWVuY2UgPSBhbW91bnQgPiAwID8gdmlld1NlcXVlbmNlLmdldE5leHQoKSA6IHZpZXdTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgICAgICBpZiAobmV4dFZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgdmlld1NlcXVlbmNlID0gbmV4dFZpZXdTZXF1ZW5jZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9zY3JvbGxUb1NlcXVlbmNlLmNhbGwodGhpcywgdmlld1NlcXVlbmNlLCBhbW91bnQgPj0gMCk7XG59XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nb1RvRmlyc3RQYWdlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZiAodGhpcy5fdmlld1NlcXVlbmNlLl8gJiYgdGhpcy5fdmlld1NlcXVlbmNlLl8ubG9vcCkge1xuICAgICAgICBMYXlvdXRVdGlsaXR5LmVycm9yKCdVbmFibGUgdG8gZ28gdG8gZmlyc3QgaXRlbSBvZiBsb29wZWQgVmlld1NlcXVlbmNlJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB2YXIgdmlld1NlcXVlbmNlID0gdGhpcy5fdmlld1NlcXVlbmNlO1xuICAgIHdoaWxlICh2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgdmFyIHByZXYgPSB2aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgaWYgKHByZXYgJiYgcHJldi5nZXQoKSkge1xuICAgICAgICAgICAgdmlld1NlcXVlbmNlID0gcHJldjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9zY3JvbGxUb1NlcXVlbmNlLmNhbGwodGhpcywgdmlld1NlcXVlbmNlLCBmYWxzZSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ29Ub1ByZXZpb3VzUGFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBfZ29Ub1BhZ2UuY2FsbCh0aGlzLCAtMSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ29Ub05leHRQYWdlID0gZnVuY3Rpb24gKCkge1xuICAgIF9nb1RvUGFnZS5jYWxsKHRoaXMsIDEpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdvVG9MYXN0UGFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuX3ZpZXdTZXF1ZW5jZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKHRoaXMuX3ZpZXdTZXF1ZW5jZS5fICYmIHRoaXMuX3ZpZXdTZXF1ZW5jZS5fLmxvb3ApIHtcbiAgICAgICAgTGF5b3V0VXRpbGl0eS5lcnJvcignVW5hYmxlIHRvIGdvIHRvIGxhc3QgaXRlbSBvZiBsb29wZWQgVmlld1NlcXVlbmNlJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB2YXIgdmlld1NlcXVlbmNlID0gdGhpcy5fdmlld1NlcXVlbmNlO1xuICAgIHdoaWxlICh2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgdmFyIG5leHQgPSB2aWV3U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgICAgICBpZiAobmV4dCAmJiBuZXh0LmdldCgpKSB7XG4gICAgICAgICAgICB2aWV3U2VxdWVuY2UgPSBuZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX3Njcm9sbFRvU2VxdWVuY2UuY2FsbCh0aGlzLCB2aWV3U2VxdWVuY2UsIHRydWUpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdvVG9SZW5kZXJOb2RlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICBpZiAoIXRoaXMuX3ZpZXdTZXF1ZW5jZSB8fCAhbm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKHRoaXMuX3ZpZXdTZXF1ZW5jZS5nZXQoKSA9PT0gbm9kZSkge1xuICAgICAgICB2YXIgbmV4dCA9IF9jYWxjU2Nyb2xsT2Zmc2V0LmNhbGwodGhpcykgPj0gMDtcbiAgICAgICAgX3Njcm9sbFRvU2VxdWVuY2UuY2FsbCh0aGlzLCB0aGlzLl92aWV3U2VxdWVuY2UsIG5leHQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdmFyIG5leHRTZXF1ZW5jZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgdmFyIHByZXZTZXF1ZW5jZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgIHdoaWxlICgobmV4dFNlcXVlbmNlIHx8IHByZXZTZXF1ZW5jZSkgJiYgbmV4dFNlcXVlbmNlICE9PSB0aGlzLl92aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgdmFyIG5leHROb2RlID0gbmV4dFNlcXVlbmNlID8gbmV4dFNlcXVlbmNlLmdldCgpIDogdW5kZWZpbmVkO1xuICAgICAgICBpZiAobmV4dE5vZGUgPT09IG5vZGUpIHtcbiAgICAgICAgICAgIF9zY3JvbGxUb1NlcXVlbmNlLmNhbGwodGhpcywgbmV4dFNlcXVlbmNlLCB0cnVlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcmV2Tm9kZSA9IHByZXZTZXF1ZW5jZSA/IHByZXZTZXF1ZW5jZS5nZXQoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHByZXZOb2RlID09PSBub2RlKSB7XG4gICAgICAgICAgICBfc2Nyb2xsVG9TZXF1ZW5jZS5jYWxsKHRoaXMsIHByZXZTZXF1ZW5jZSwgZmFsc2UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dFNlcXVlbmNlID0gbmV4dE5vZGUgPyBuZXh0U2VxdWVuY2UuZ2V0TmV4dCgpIDogdW5kZWZpbmVkO1xuICAgICAgICBwcmV2U2VxdWVuY2UgPSBwcmV2Tm9kZSA/IHByZXZTZXF1ZW5jZS5nZXRQcmV2aW91cygpIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5lbnN1cmVWaXNpYmxlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIFZpZXdTZXF1ZW5jZSkge1xuICAgICAgICBub2RlID0gbm9kZS5nZXQoKTtcbiAgICB9IGVsc2UgaWYgKG5vZGUgaW5zdGFuY2VvZiBOdW1iZXIgfHwgdHlwZW9mIG5vZGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHZhciB2aWV3U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2U7XG4gICAgICAgIHdoaWxlICh2aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKSA8IG5vZGUpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgICAgICAgICBpZiAoIXZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHdoaWxlICh2aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKSA+IG5vZGUpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgICAgICAgICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5fdmlld1NlcXVlbmNlLmdldCgpID09PSBub2RlKSB7XG4gICAgICAgIHZhciBuZXh0ID0gX2NhbGNTY3JvbGxPZmZzZXQuY2FsbCh0aGlzKSA+PSAwO1xuICAgICAgICBfZW5zdXJlVmlzaWJsZVNlcXVlbmNlLmNhbGwodGhpcywgdGhpcy5fdmlld1NlcXVlbmNlLCBuZXh0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHZhciBuZXh0U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgIHZhciBwcmV2U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICB3aGlsZSAoKG5leHRTZXF1ZW5jZSB8fCBwcmV2U2VxdWVuY2UpICYmIG5leHRTZXF1ZW5jZSAhPT0gdGhpcy5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHZhciBuZXh0Tm9kZSA9IG5leHRTZXF1ZW5jZSA/IG5leHRTZXF1ZW5jZS5nZXQoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKG5leHROb2RlID09PSBub2RlKSB7XG4gICAgICAgICAgICBfZW5zdXJlVmlzaWJsZVNlcXVlbmNlLmNhbGwodGhpcywgbmV4dFNlcXVlbmNlLCB0cnVlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcmV2Tm9kZSA9IHByZXZTZXF1ZW5jZSA/IHByZXZTZXF1ZW5jZS5nZXQoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHByZXZOb2RlID09PSBub2RlKSB7XG4gICAgICAgICAgICBfZW5zdXJlVmlzaWJsZVNlcXVlbmNlLmNhbGwodGhpcywgcHJldlNlcXVlbmNlLCBmYWxzZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBuZXh0U2VxdWVuY2UgPSBuZXh0Tm9kZSA/IG5leHRTZXF1ZW5jZS5nZXROZXh0KCkgOiB1bmRlZmluZWQ7XG4gICAgICAgIHByZXZTZXF1ZW5jZSA9IHByZXZOb2RlID8gcHJldlNlcXVlbmNlLmdldFByZXZpb3VzKCkgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnNjcm9sbCA9IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgIHRoaXMuaGFsdCgpO1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxEZWx0YSArPSBkZWx0YTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5jYW5TY3JvbGwgPSBmdW5jdGlvbiAoZGVsdGEpIHtcbiAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gX2NhbGNTY3JvbGxPZmZzZXQuY2FsbCh0aGlzKTtcbiAgICB2YXIgcHJldkhlaWdodCA9IHRoaXMuX2NhbGNTY3JvbGxIZWlnaHQoZmFsc2UpO1xuICAgIHZhciBuZXh0SGVpZ2h0ID0gdGhpcy5fY2FsY1Njcm9sbEhlaWdodCh0cnVlKTtcbiAgICB2YXIgdG90YWxIZWlnaHQ7XG4gICAgaWYgKG5leHRIZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBwcmV2SGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdG90YWxIZWlnaHQgPSBwcmV2SGVpZ2h0ICsgbmV4dEhlaWdodDtcbiAgICB9XG4gICAgaWYgKHRvdGFsSGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgdG90YWxIZWlnaHQgPD0gdGhpcy5fY29udGV4dFNpemVDYWNoZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAoZGVsdGEgPCAwICYmIG5leHRIZWlnaHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgbmV4dE9mZnNldCA9IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbdGhpcy5fZGlyZWN0aW9uXSAtIChzY3JvbGxPZmZzZXQgKyBuZXh0SGVpZ2h0KTtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KG5leHRPZmZzZXQsIGRlbHRhKTtcbiAgICB9IGVsc2UgaWYgKGRlbHRhID4gMCAmJiBwcmV2SGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIHByZXZPZmZzZXQgPSAtKHNjcm9sbE9mZnNldCAtIHByZXZIZWlnaHQpO1xuICAgICAgICByZXR1cm4gTWF0aC5taW4ocHJldk9mZnNldCwgZGVsdGEpO1xuICAgIH1cbiAgICByZXR1cm4gZGVsdGE7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuaGFsdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9TZXF1ZW5jZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zY3JvbGwuZW5zdXJlVmlzaWJsZVNlcXVlbmNlID0gdW5kZWZpbmVkO1xuICAgIF9zZXRQYXJ0aWNsZS5jYWxsKHRoaXMsIHVuZGVmaW5lZCwgMCwgJ2hhbHQnKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5pc1Njcm9sbGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2Nyb2xsLmlzU2Nyb2xsaW5nO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdldEJvdW5kc1JlYWNoZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdldFZlbG9jaXR5ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9zY3JvbGwucGFydGljbGUuZ2V0VmVsb2NpdHkxRCgpO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnNldFZlbG9jaXR5ID0gZnVuY3Rpb24gKHZlbG9jaXR5KSB7XG4gICAgcmV0dXJuIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZS5zZXRWZWxvY2l0eTFEKHZlbG9jaXR5KTtcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5hcHBseVNjcm9sbEZvcmNlID0gZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgdGhpcy5oYWx0KCk7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQrKztcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2UgKz0gZGVsdGE7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUudXBkYXRlU2Nyb2xsRm9yY2UgPSBmdW5jdGlvbiAocHJldkRlbHRhLCBuZXdEZWx0YSkge1xuICAgIHRoaXMuaGFsdCgpO1xuICAgIG5ld0RlbHRhIC09IHByZXZEZWx0YTtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2UgKz0gbmV3RGVsdGE7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUucmVsZWFzZVNjcm9sbEZvcmNlID0gZnVuY3Rpb24gKGRlbHRhLCB2ZWxvY2l0eSkge1xuICAgIHRoaXMuaGFsdCgpO1xuICAgIGlmICh0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCA9PT0gMSkge1xuICAgICAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gX2NhbGNTY3JvbGxPZmZzZXQuY2FsbCh0aGlzKTtcbiAgICAgICAgX3NldFBhcnRpY2xlLmNhbGwodGhpcywgc2Nyb2xsT2Zmc2V0LCB2ZWxvY2l0eSwgJ3JlbGVhc2VTY3JvbGxGb3JjZScpO1xuICAgICAgICB0aGlzLl9zY3JvbGwucGUud2FrZSgpO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2UgPSAwO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZSAtPSBkZWx0YTtcbiAgICB9XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQtLTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5mdW5jdGlvbiBfbGF5b3V0KHNpemUsIHNjcm9sbE9mZnNldCwgbmVzdGVkKSB7XG4gICAgdGhpcy5fZGVidWcubGF5b3V0Q291bnQrKztcbiAgICB2YXIgc2Nyb2xsU3RhcnQgPSAwIC0gTWF0aC5tYXgodGhpcy5vcHRpb25zLmV4dHJhQm91bmRzU3BhY2VbMF0sIDEpO1xuICAgIHZhciBzY3JvbGxFbmQgPSBzaXplW3RoaXMuX2RpcmVjdGlvbl0gKyBNYXRoLm1heCh0aGlzLm9wdGlvbnMuZXh0cmFCb3VuZHNTcGFjZVsxXSwgMSk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5sYXlvdXRBbGwpIHtcbiAgICAgICAgc2Nyb2xsU3RhcnQgPSAtMTAwMDAwMDtcbiAgICAgICAgc2Nyb2xsRW5kID0gMTAwMDAwMDtcbiAgICB9XG4gICAgdmFyIGxheW91dENvbnRleHQgPSB0aGlzLl9ub2Rlcy5wcmVwYXJlRm9yTGF5b3V0KHRoaXMuX3ZpZXdTZXF1ZW5jZSwgdGhpcy5fbm9kZXNCeUlkLCB7XG4gICAgICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLl9kaXJlY3Rpb24sXG4gICAgICAgICAgICByZXZlcnNlOiB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0OiB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID8gc2Nyb2xsT2Zmc2V0ICsgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dIDogc2Nyb2xsT2Zmc2V0LFxuICAgICAgICAgICAgc2Nyb2xsU3RhcnQ6IHNjcm9sbFN0YXJ0LFxuICAgICAgICAgICAgc2Nyb2xsRW5kOiBzY3JvbGxFbmRcbiAgICAgICAgfSk7XG4gICAgaWYgKHRoaXMuX2xheW91dC5fZnVuY3Rpb24pIHtcbiAgICAgICAgdGhpcy5fbGF5b3V0Ll9mdW5jdGlvbihsYXlvdXRDb250ZXh0LCB0aGlzLl9sYXlvdXQub3B0aW9ucyk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9wb3N0TGF5b3V0KSB7XG4gICAgICAgIHRoaXMuX3Bvc3RMYXlvdXQoc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICB9XG4gICAgdGhpcy5fbm9kZXMucmVtb3ZlTm9uSW52YWxpZGF0ZWROb2Rlcyh0aGlzLm9wdGlvbnMucmVtb3ZlU3BlYyk7XG4gICAgX2NhbGNCb3VuZHMuY2FsbCh0aGlzLCBzaXplLCBzY3JvbGxPZmZzZXQpO1xuICAgIF9jYWxjU2Nyb2xsVG9PZmZzZXQuY2FsbCh0aGlzLCBzaXplLCBzY3JvbGxPZmZzZXQpO1xuICAgIF9zbmFwVG9QYWdlLmNhbGwodGhpcywgc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICB2YXIgbmV3U2Nyb2xsT2Zmc2V0ID0gX2NhbGNTY3JvbGxPZmZzZXQuY2FsbCh0aGlzLCB0cnVlKTtcbiAgICBpZiAoIW5lc3RlZCAmJiBuZXdTY3JvbGxPZmZzZXQgIT09IHNjcm9sbE9mZnNldCkge1xuICAgICAgICByZXR1cm4gX2xheW91dC5jYWxsKHRoaXMsIHNpemUsIG5ld1Njcm9sbE9mZnNldCwgdHJ1ZSk7XG4gICAgfVxuICAgIHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQ7XG4gICAgc2Nyb2xsT2Zmc2V0ID0gX25vcm1hbGl6ZVZpZXdTZXF1ZW5jZS5jYWxsKHRoaXMsIHNpemUsIHNjcm9sbE9mZnNldCk7XG4gICAgX3VwZGF0ZVNwcmluZy5jYWxsKHRoaXMpO1xuICAgIHJldHVybiBzY3JvbGxPZmZzZXQ7XG59XG52YXIgb2xkU2V0RGlyZWN0aW9uID0gU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuc2V0RGlyZWN0aW9uO1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuc2V0RGlyZWN0aW9uID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xuICAgIHZhciBvbGREaXJlY3Rpb24gPSB0aGlzLl9kaXJlY3Rpb247XG4gICAgb2xkU2V0RGlyZWN0aW9uLmNhbGwodGhpcywgZGlyZWN0aW9uKTtcbiAgICBpZiAob2xkRGlyZWN0aW9uICE9PSB0aGlzLl9kaXJlY3Rpb24pIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKCk7XG4gICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5faW52YWxpZGF0ZWQgJiYgbm9kZS5zZXREaXJlY3Rpb25Mb2NrKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5zZXREaXJlY3Rpb25Mb2NrKHRoaXMuX2RpcmVjdGlvbiwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICAgICAgfVxuICAgIH1cbn07XG5mdW5jdGlvbiBfaW5uZXJSZW5kZXIoKSB7XG4gICAgdmFyIHNwZWNzID0gdGhpcy5fc3BlY3M7XG4gICAgZm9yICh2YXIgaTMgPSAwLCBqMyA9IHNwZWNzLmxlbmd0aDsgaTMgPCBqMzsgaTMrKykge1xuICAgICAgICBzcGVjc1tpM10udGFyZ2V0ID0gc3BlY3NbaTNdLnJlbmRlck5vZGUucmVuZGVyKCk7XG4gICAgfVxuICAgIHJldHVybiBzcGVjcztcbn1cblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmNvbW1pdCA9IGZ1bmN0aW9uIGNvbW1pdChjb250ZXh0KSB7XG4gICAgdmFyIHNpemUgPSBjb250ZXh0LnNpemU7XG4gICAgdGhpcy5fZGVidWcuY29tbWl0Q291bnQrKztcbiAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gX2NhbGNTY3JvbGxPZmZzZXQuY2FsbCh0aGlzLCB0cnVlLCB0cnVlKTtcbiAgICBpZiAodGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZSA9IHNjcm9sbE9mZnNldDtcbiAgICB9XG4gICAgdmFyIGVtaXRFbmRTY3JvbGxpbmdFdmVudCA9IGZhbHNlO1xuICAgIHZhciBlbWl0U2Nyb2xsRXZlbnQgPSBmYWxzZTtcbiAgICB2YXIgZXZlbnREYXRhO1xuICAgIGlmIChzaXplWzBdICE9PSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzBdIHx8IHNpemVbMV0gIT09IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMV0gfHwgdGhpcy5faXNEaXJ0eSB8fCB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgfHwgdGhpcy5fbm9kZXMuX3RydWVTaXplUmVxdWVzdGVkIHx8IHRoaXMub3B0aW9ucy5hbHdheXNMYXlvdXQgfHwgdGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGUgIT09IHNjcm9sbE9mZnNldCkge1xuICAgICAgICBldmVudERhdGEgPSB7XG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMsXG4gICAgICAgICAgICBvbGRTaXplOiB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlLFxuICAgICAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgICAgIG9sZFNjcm9sbE9mZnNldDogdGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGUsXG4gICAgICAgICAgICBzY3JvbGxPZmZzZXQ6IHNjcm9sbE9mZnNldFxuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGUgIT09IHNjcm9sbE9mZnNldCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9zY3JvbGwuaXNTY3JvbGxpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuaXNTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ3Njcm9sbHN0YXJ0JywgZXZlbnREYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVtaXRTY3JvbGxFdmVudCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgnbGF5b3V0c3RhcnQnLCBldmVudERhdGEpO1xuICAgICAgICBpZiAodGhpcy5faXNEaXJ0eSB8fCBzaXplWzBdICE9PSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzBdIHx8IHNpemVbMV0gIT09IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMV0pIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSgpO1xuICAgICAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5faW52YWxpZGF0ZWQgJiYgbm9kZS5zZXREaXJlY3Rpb25Mb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0RGlyZWN0aW9uTG9jayh0aGlzLl9kaXJlY3Rpb24sIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzBdID0gc2l6ZVswXTtcbiAgICAgICAgdGhpcy5fY29udGV4dFNpemVDYWNoZVsxXSA9IHNpemVbMV07XG4gICAgICAgIHRoaXMuX2lzRGlydHkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNjcm9sbERpcnR5ID0gZmFsc2U7XG4gICAgICAgIHNjcm9sbE9mZnNldCA9IF9sYXlvdXQuY2FsbCh0aGlzLCBzaXplLCBzY3JvbGxPZmZzZXQpO1xuICAgICAgICB0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZSA9IHNjcm9sbE9mZnNldDtcbiAgICAgICAgZXZlbnREYXRhLnNjcm9sbE9mZnNldCA9IHRoaXMuX3Njcm9sbE9mZnNldENhY2hlO1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdsYXlvdXRlbmQnLCBldmVudERhdGEpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fc2Nyb2xsLmlzU2Nyb2xsaW5nICYmICF0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCkge1xuICAgICAgICBlbWl0RW5kU2Nyb2xsaW5nRXZlbnQgPSB0cnVlO1xuICAgIH1cbiAgICB2YXIgZ3JvdXBUcmFuc2xhdGUgPSB0aGlzLl9zY3JvbGwuZ3JvdXBUcmFuc2xhdGU7XG4gICAgZ3JvdXBUcmFuc2xhdGVbMF0gPSAwO1xuICAgIGdyb3VwVHJhbnNsYXRlWzFdID0gMDtcbiAgICBncm91cFRyYW5zbGF0ZVsyXSA9IDA7XG4gICAgZ3JvdXBUcmFuc2xhdGVbdGhpcy5fZGlyZWN0aW9uXSA9IC10aGlzLl9zY3JvbGwuZ3JvdXBTdGFydCAtIHNjcm9sbE9mZnNldDtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5fbm9kZXMuYnVpbGRTcGVjQW5kRGVzdHJveVVucmVuZGVyZWROb2Rlcyh0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzLnNlcXVlbnRpYWxTY3JvbGxpbmdPcHRpbWl6ZWQgPyBncm91cFRyYW5zbGF0ZSA6IHVuZGVmaW5lZCk7XG4gICAgdGhpcy5fc3BlY3MgPSByZXN1bHQuc3BlY3M7XG4gICAgaWYgKHJlc3VsdC5tb2RpZmllZCkge1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdyZWZsb3cnLCB7IHRhcmdldDogdGhpcyB9KTtcbiAgICB9XG4gICAgaWYgKGVtaXRTY3JvbGxFdmVudCkge1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdzY3JvbGwnLCBldmVudERhdGEpO1xuICAgIH1cbiAgICBpZiAoZW1pdEVuZFNjcm9sbGluZ0V2ZW50KSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5pc1Njcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICBldmVudERhdGEgPSB7XG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMsXG4gICAgICAgICAgICBvbGRTaXplOiBzaXplLFxuICAgICAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgICAgIG9sZFNjcm9sbE9mZnNldDogc2Nyb2xsT2Zmc2V0LFxuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0OiBzY3JvbGxPZmZzZXRcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgnc2Nyb2xsZW5kJywgZXZlbnREYXRhKTtcbiAgICB9XG4gICAgdmFyIHRyYW5zZm9ybSA9IGNvbnRleHQudHJhbnNmb3JtO1xuICAgIGlmICh0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzLnNlcXVlbnRpYWxTY3JvbGxpbmdPcHRpbWl6ZWQpIHtcbiAgICAgICAgdmFyIHdpbmRvd09mZnNldCA9IHNjcm9sbE9mZnNldCArIHRoaXMuX3Njcm9sbC5ncm91cFN0YXJ0O1xuICAgICAgICB2YXIgdHJhbnNsYXRlID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB0cmFuc2xhdGVbdGhpcy5fZGlyZWN0aW9uXSA9IHdpbmRvd09mZnNldDtcbiAgICAgICAgdHJhbnNmb3JtID0gVHJhbnNmb3JtLnRoZW5Nb3ZlKHRyYW5zZm9ybSwgdHJhbnNsYXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2Zvcm0sXG4gICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgIG9wYWNpdHk6IGNvbnRleHQub3BhY2l0eSxcbiAgICAgICAgb3JpZ2luOiBjb250ZXh0Lm9yaWdpbixcbiAgICAgICAgdGFyZ2V0OiB0aGlzLmdyb3VwLnJlbmRlcigpXG4gICAgfTtcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgaWYgKHRoaXMuY29udGFpbmVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lci5yZW5kZXIuYXBwbHkodGhpcy5jb250YWluZXIsIGFyZ3VtZW50cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gU2Nyb2xsQ29udHJvbGxlcjtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsInZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi4vTGF5b3V0VXRpbGl0eScpO1xuZnVuY3Rpb24gTGF5b3V0RG9ja0hlbHBlcihjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIHNpemUgPSBjb250ZXh0LnNpemU7XG4gICAgdGhpcy5fc2l6ZSA9IHNpemU7XG4gICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG4gICAgdGhpcy5fb3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5feiA9IG9wdGlvbnMgJiYgb3B0aW9ucy50cmFuc2xhdGVaID8gb3B0aW9ucy50cmFuc2xhdGVaIDogMDtcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLm1hcmdpbnMpIHtcbiAgICAgICAgdmFyIG1hcmdpbnMgPSBMYXlvdXRVdGlsaXR5Lm5vcm1hbGl6ZU1hcmdpbnMob3B0aW9ucy5tYXJnaW5zKTtcbiAgICAgICAgdGhpcy5fbGVmdCA9IG1hcmdpbnNbM107XG4gICAgICAgIHRoaXMuX3RvcCA9IG1hcmdpbnNbMF07XG4gICAgICAgIHRoaXMuX3JpZ2h0ID0gc2l6ZVswXSAtIG1hcmdpbnNbMV07XG4gICAgICAgIHRoaXMuX2JvdHRvbSA9IHNpemVbMV0gLSBtYXJnaW5zWzJdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2xlZnQgPSAwO1xuICAgICAgICB0aGlzLl90b3AgPSAwO1xuICAgICAgICB0aGlzLl9yaWdodCA9IHNpemVbMF07XG4gICAgICAgIHRoaXMuX2JvdHRvbSA9IHNpemVbMV07XG4gICAgfVxufVxuTGF5b3V0RG9ja0hlbHBlci5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcnVsZSA9IGRhdGFbaV07XG4gICAgICAgIHZhciB2YWx1ZSA9IHJ1bGUubGVuZ3RoID49IDMgPyBydWxlWzJdIDogdW5kZWZpbmVkO1xuICAgICAgICBpZiAocnVsZVswXSA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICAgIHRoaXMudG9wKHJ1bGVbMV0sIHZhbHVlLCBydWxlLmxlbmd0aCA+PSA0ID8gcnVsZVszXSA6IHVuZGVmaW5lZCk7XG4gICAgICAgIH0gZWxzZSBpZiAocnVsZVswXSA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICB0aGlzLmxlZnQocnVsZVsxXSwgdmFsdWUsIHJ1bGUubGVuZ3RoID49IDQgPyBydWxlWzNdIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfSBlbHNlIGlmIChydWxlWzBdID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICB0aGlzLnJpZ2h0KHJ1bGVbMV0sIHZhbHVlLCBydWxlLmxlbmd0aCA+PSA0ID8gcnVsZVszXSA6IHVuZGVmaW5lZCk7XG4gICAgICAgIH0gZWxzZSBpZiAocnVsZVswXSA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICAgIHRoaXMuYm90dG9tKHJ1bGVbMV0sIHZhbHVlLCBydWxlLmxlbmd0aCA+PSA0ID8gcnVsZVszXSA6IHVuZGVmaW5lZCk7XG4gICAgICAgIH0gZWxzZSBpZiAocnVsZVswXSA9PT0gJ2ZpbGwnKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGwocnVsZVsxXSwgcnVsZS5sZW5ndGggPj0gMyA/IHJ1bGVbMl0gOiB1bmRlZmluZWQpO1xuICAgICAgICB9IGVsc2UgaWYgKHJ1bGVbMF0gPT09ICdtYXJnaW5zJykge1xuICAgICAgICAgICAgdGhpcy5tYXJnaW5zKHJ1bGVbMV0pO1xuICAgICAgICB9XG4gICAgfVxufTtcbkxheW91dERvY2tIZWxwZXIucHJvdG90eXBlLnRvcCA9IGZ1bmN0aW9uIChub2RlLCBoZWlnaHQsIHopIHtcbiAgICBpZiAoaGVpZ2h0IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgaGVpZ2h0ID0gaGVpZ2h0WzFdO1xuICAgIH1cbiAgICBpZiAoaGVpZ2h0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIHNpemUgPSB0aGlzLl9jb250ZXh0LnJlc29sdmVTaXplKG5vZGUsIFtcbiAgICAgICAgICAgICAgICB0aGlzLl9yaWdodCAtIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICAgICAgdGhpcy5fYm90dG9tIC0gdGhpcy5fdG9wXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgaGVpZ2h0ID0gc2l6ZVsxXTtcbiAgICB9XG4gICAgdGhpcy5fY29udGV4dC5zZXQobm9kZSwge1xuICAgICAgICBzaXplOiBbXG4gICAgICAgICAgICB0aGlzLl9yaWdodCAtIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICBoZWlnaHRcbiAgICAgICAgXSxcbiAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBhbGlnbjogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICB0aGlzLl9sZWZ0LFxuICAgICAgICAgICAgdGhpcy5fdG9wLFxuICAgICAgICAgICAgeiA9PT0gdW5kZWZpbmVkID8gdGhpcy5feiA6IHpcbiAgICAgICAgXVxuICAgIH0pO1xuICAgIHRoaXMuX3RvcCArPSBoZWlnaHQ7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0RG9ja0hlbHBlci5wcm90b3R5cGUubGVmdCA9IGZ1bmN0aW9uIChub2RlLCB3aWR0aCwgeikge1xuICAgIGlmICh3aWR0aCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIHdpZHRoID0gd2lkdGhbMF07XG4gICAgfVxuICAgIGlmICh3aWR0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhciBzaXplID0gdGhpcy5fY29udGV4dC5yZXNvbHZlU2l6ZShub2RlLCBbXG4gICAgICAgICAgICAgICAgdGhpcy5fcmlnaHQgLSB0aGlzLl9sZWZ0LFxuICAgICAgICAgICAgICAgIHRoaXMuX2JvdHRvbSAtIHRoaXMuX3RvcFxuICAgICAgICAgICAgXSk7XG4gICAgICAgIHdpZHRoID0gc2l6ZVswXTtcbiAgICB9XG4gICAgdGhpcy5fY29udGV4dC5zZXQobm9kZSwge1xuICAgICAgICBzaXplOiBbXG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIHRoaXMuX2JvdHRvbSAtIHRoaXMuX3RvcFxuICAgICAgICBdLFxuICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICB0aGlzLl90b3AsXG4gICAgICAgICAgICB6ID09PSB1bmRlZmluZWQgPyB0aGlzLl96IDogelxuICAgICAgICBdXG4gICAgfSk7XG4gICAgdGhpcy5fbGVmdCArPSB3aWR0aDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXREb2NrSGVscGVyLnByb3RvdHlwZS5ib3R0b20gPSBmdW5jdGlvbiAobm9kZSwgaGVpZ2h0LCB6KSB7XG4gICAgaWYgKGhlaWdodCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGhlaWdodCA9IGhlaWdodFsxXTtcbiAgICB9XG4gICAgaWYgKGhlaWdodCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhciBzaXplID0gdGhpcy5fY29udGV4dC5yZXNvbHZlU2l6ZShub2RlLCBbXG4gICAgICAgICAgICAgICAgdGhpcy5fcmlnaHQgLSB0aGlzLl9sZWZ0LFxuICAgICAgICAgICAgICAgIHRoaXMuX2JvdHRvbSAtIHRoaXMuX3RvcFxuICAgICAgICAgICAgXSk7XG4gICAgICAgIGhlaWdodCA9IHNpemVbMV07XG4gICAgfVxuICAgIHRoaXMuX2NvbnRleHQuc2V0KG5vZGUsIHtcbiAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgdGhpcy5fcmlnaHQgLSB0aGlzLl9sZWZ0LFxuICAgICAgICAgICAgaGVpZ2h0XG4gICAgICAgIF0sXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDFcbiAgICAgICAgXSxcbiAgICAgICAgYWxpZ246IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAxXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgdGhpcy5fbGVmdCxcbiAgICAgICAgICAgIC0odGhpcy5fc2l6ZVsxXSAtIHRoaXMuX2JvdHRvbSksXG4gICAgICAgICAgICB6ID09PSB1bmRlZmluZWQgPyB0aGlzLl96IDogelxuICAgICAgICBdXG4gICAgfSk7XG4gICAgdGhpcy5fYm90dG9tIC09IGhlaWdodDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXREb2NrSGVscGVyLnByb3RvdHlwZS5yaWdodCA9IGZ1bmN0aW9uIChub2RlLCB3aWR0aCwgeikge1xuICAgIGlmICh3aWR0aCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIHdpZHRoID0gd2lkdGhbMF07XG4gICAgfVxuICAgIGlmIChub2RlKSB7XG4gICAgICAgIGlmICh3aWR0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB2YXIgc2l6ZSA9IHRoaXMuX2NvbnRleHQucmVzb2x2ZVNpemUobm9kZSwgW1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yaWdodCAtIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2JvdHRvbSAtIHRoaXMuX3RvcFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgd2lkdGggPSBzaXplWzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NvbnRleHQuc2V0KG5vZGUsIHtcbiAgICAgICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgICB0aGlzLl9ib3R0b20gLSB0aGlzLl90b3BcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBhbGlnbjogW1xuICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgICAgIC0odGhpcy5fc2l6ZVswXSAtIHRoaXMuX3JpZ2h0KSxcbiAgICAgICAgICAgICAgICB0aGlzLl90b3AsXG4gICAgICAgICAgICAgICAgeiA9PT0gdW5kZWZpbmVkID8gdGhpcy5feiA6IHpcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh3aWR0aCkge1xuICAgICAgICB0aGlzLl9yaWdodCAtPSB3aWR0aDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0RG9ja0hlbHBlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIChub2RlLCB6KSB7XG4gICAgdGhpcy5fY29udGV4dC5zZXQobm9kZSwge1xuICAgICAgICBzaXplOiBbXG4gICAgICAgICAgICB0aGlzLl9yaWdodCAtIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICB0aGlzLl9ib3R0b20gLSB0aGlzLl90b3BcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICB0aGlzLl9sZWZ0LFxuICAgICAgICAgICAgdGhpcy5fdG9wLFxuICAgICAgICAgICAgeiA9PT0gdW5kZWZpbmVkID8gdGhpcy5feiA6IHpcbiAgICAgICAgXVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dERvY2tIZWxwZXIucHJvdG90eXBlLm1hcmdpbnMgPSBmdW5jdGlvbiAobWFyZ2lucykge1xuICAgIG1hcmdpbnMgPSBMYXlvdXRVdGlsaXR5Lm5vcm1hbGl6ZU1hcmdpbnMobWFyZ2lucyk7XG4gICAgdGhpcy5fbGVmdCArPSBtYXJnaW5zWzNdO1xuICAgIHRoaXMuX3RvcCArPSBtYXJnaW5zWzBdO1xuICAgIHRoaXMuX3JpZ2h0IC09IG1hcmdpbnNbMV07XG4gICAgdGhpcy5fYm90dG9tIC09IG1hcmdpbnNbMl07XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0VXRpbGl0eS5yZWdpc3RlckhlbHBlcignZG9jaycsIExheW91dERvY2tIZWxwZXIpO1xubW9kdWxlLmV4cG9ydHMgPSBMYXlvdXREb2NrSGVscGVyOyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBVdGlsaXR5ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnV0aWxpdGllcy5VdGlsaXR5IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnV0aWxpdGllcy5VdGlsaXR5IDogbnVsbDtcbnZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi4vTGF5b3V0VXRpbGl0eScpO1xudmFyIGNhcGFiaWxpdGllcyA9IHtcbiAgICAgICAgc2VxdWVuY2U6IHRydWUsXG4gICAgICAgIGRpcmVjdGlvbjogW1xuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWSxcbiAgICAgICAgICAgIFV0aWxpdHkuRGlyZWN0aW9uLlhcbiAgICAgICAgXSxcbiAgICAgICAgc2Nyb2xsaW5nOiB0cnVlLFxuICAgICAgICB0cnVlU2l6ZTogdHJ1ZSxcbiAgICAgICAgc2VxdWVudGlhbFNjcm9sbGluZ09wdGltaXplZDogdHJ1ZVxuICAgIH07XG52YXIgY29udGV4dDtcbnZhciBzaXplO1xudmFyIGRpcmVjdGlvbjtcbnZhciBhbGlnbm1lbnQ7XG52YXIgbGluZURpcmVjdGlvbjtcbnZhciBsaW5lTGVuZ3RoO1xudmFyIG9mZnNldDtcbnZhciBtYXJnaW5zO1xudmFyIG1hcmdpbiA9IFtcbiAgICAgICAgMCxcbiAgICAgICAgMFxuICAgIF07XG52YXIgc3BhY2luZztcbnZhciBqdXN0aWZ5O1xudmFyIGl0ZW1TaXplO1xudmFyIGdldEl0ZW1TaXplO1xudmFyIGxpbmVOb2RlcztcbmZ1bmN0aW9uIF9sYXlvdXRMaW5lKG5leHQsIGVuZFJlYWNoZWQpIHtcbiAgICBpZiAoIWxpbmVOb2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciBpO1xuICAgIHZhciBsaW5lU2l6ZSA9IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF07XG4gICAgdmFyIGxpbmVOb2RlO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsaW5lTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGluZVNpemVbZGlyZWN0aW9uXSA9IE1hdGgubWF4KGxpbmVTaXplW2RpcmVjdGlvbl0sIGxpbmVOb2Rlc1tpXS5zaXplW2RpcmVjdGlvbl0pO1xuICAgICAgICBsaW5lU2l6ZVtsaW5lRGlyZWN0aW9uXSArPSAoaSA+IDAgPyBzcGFjaW5nW2xpbmVEaXJlY3Rpb25dIDogMCkgKyBsaW5lTm9kZXNbaV0uc2l6ZVtsaW5lRGlyZWN0aW9uXTtcbiAgICB9XG4gICAgdmFyIGp1c3RpZnlPZmZzZXQgPSBqdXN0aWZ5W2xpbmVEaXJlY3Rpb25dID8gKGxpbmVMZW5ndGggLSBsaW5lU2l6ZVtsaW5lRGlyZWN0aW9uXSkgLyAobGluZU5vZGVzLmxlbmd0aCAqIDIpIDogMDtcbiAgICB2YXIgbGluZU9mZnNldCA9IChkaXJlY3Rpb24gPyBtYXJnaW5zWzNdIDogbWFyZ2luc1swXSkgKyBqdXN0aWZ5T2Zmc2V0O1xuICAgIHZhciBzY3JvbGxMZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxpbmVOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsaW5lTm9kZSA9IGxpbmVOb2Rlc1tpXTtcbiAgICAgICAgdmFyIHRyYW5zbGF0ZSA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXTtcbiAgICAgICAgdHJhbnNsYXRlW2xpbmVEaXJlY3Rpb25dID0gbGluZU9mZnNldDtcbiAgICAgICAgdHJhbnNsYXRlW2RpcmVjdGlvbl0gPSBuZXh0ID8gb2Zmc2V0IDogb2Zmc2V0IC0gbGluZVNpemVbZGlyZWN0aW9uXTtcbiAgICAgICAgc2Nyb2xsTGVuZ3RoID0gMDtcbiAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgIHNjcm9sbExlbmd0aCA9IGxpbmVTaXplW2RpcmVjdGlvbl07XG4gICAgICAgICAgICBpZiAoZW5kUmVhY2hlZCAmJiAobmV4dCAmJiAhYWxpZ25tZW50IHx8ICFuZXh0ICYmIGFsaWdubWVudCkpIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxMZW5ndGggKz0gZGlyZWN0aW9uID8gbWFyZ2luc1swXSArIG1hcmdpbnNbMl0gOiBtYXJnaW5zWzNdICsgbWFyZ2luc1sxXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoICs9IHNwYWNpbmdbZGlyZWN0aW9uXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsaW5lTm9kZS5zZXQgPSB7XG4gICAgICAgICAgICBzaXplOiBsaW5lTm9kZS5zaXplLFxuICAgICAgICAgICAgdHJhbnNsYXRlOiB0cmFuc2xhdGUsXG4gICAgICAgICAgICBzY3JvbGxMZW5ndGg6IHNjcm9sbExlbmd0aFxuICAgICAgICB9O1xuICAgICAgICBsaW5lT2Zmc2V0ICs9IGxpbmVOb2RlLnNpemVbbGluZURpcmVjdGlvbl0gKyBzcGFjaW5nW2xpbmVEaXJlY3Rpb25dICsganVzdGlmeU9mZnNldCAqIDI7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBsaW5lTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGluZU5vZGUgPSBuZXh0ID8gbGluZU5vZGVzW2ldIDogbGluZU5vZGVzW2xpbmVOb2Rlcy5sZW5ndGggLSAxIC0gaV07XG4gICAgICAgIGNvbnRleHQuc2V0KGxpbmVOb2RlLm5vZGUsIGxpbmVOb2RlLnNldCk7XG4gICAgfVxuICAgIGxpbmVOb2RlcyA9IFtdO1xuICAgIHJldHVybiBsaW5lU2l6ZVtkaXJlY3Rpb25dICsgc3BhY2luZ1tkaXJlY3Rpb25dO1xufVxuZnVuY3Rpb24gX3Jlc29sdmVOb2RlU2l6ZShub2RlKSB7XG4gICAgdmFyIGxvY2FsSXRlbVNpemUgPSBpdGVtU2l6ZTtcbiAgICBpZiAoZ2V0SXRlbVNpemUpIHtcbiAgICAgICAgbG9jYWxJdGVtU2l6ZSA9IGdldEl0ZW1TaXplKG5vZGUucmVuZGVyTm9kZSwgc2l6ZSk7XG4gICAgfVxuICAgIGlmIChsb2NhbEl0ZW1TaXplWzBdID09PSB0cnVlIHx8IGxvY2FsSXRlbVNpemVbMV0gPT09IHRydWUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGNvbnRleHQucmVzb2x2ZVNpemUobm9kZSwgc2l6ZSk7XG4gICAgICAgIGlmIChsb2NhbEl0ZW1TaXplWzBdICE9PSB0cnVlKSB7XG4gICAgICAgICAgICByZXN1bHRbMF0gPSBpdGVtU2l6ZVswXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobG9jYWxJdGVtU2l6ZVsxXSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgcmVzdWx0WzFdID0gaXRlbVNpemVbMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbG9jYWxJdGVtU2l6ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBDb2xsZWN0aW9uTGF5b3V0KGNvbnRleHRfLCBvcHRpb25zKSB7XG4gICAgY29udGV4dCA9IGNvbnRleHRfO1xuICAgIHNpemUgPSBjb250ZXh0LnNpemU7XG4gICAgZGlyZWN0aW9uID0gY29udGV4dC5kaXJlY3Rpb247XG4gICAgYWxpZ25tZW50ID0gY29udGV4dC5hbGlnbm1lbnQ7XG4gICAgbGluZURpcmVjdGlvbiA9IChkaXJlY3Rpb24gKyAxKSAlIDI7XG4gICAgaWYgKG9wdGlvbnMuZ3V0dGVyICE9PSB1bmRlZmluZWQgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignZ3V0dGVyIGhhcyBiZWVuIGRlcHJlY2F0ZWQgZm9yIENvbGxlY3Rpb25MYXlvdXQsIHVzZSBtYXJnaW5zICYgc3BhY2luZyBpbnN0ZWFkJyk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmd1dHRlciAmJiAhb3B0aW9ucy5tYXJnaW5zICYmICFvcHRpb25zLnNwYWNpbmcpIHtcbiAgICAgICAgdmFyIGd1dHRlciA9IEFycmF5LmlzQXJyYXkob3B0aW9ucy5ndXR0ZXIpID8gb3B0aW9ucy5ndXR0ZXIgOiBbXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5ndXR0ZXIsXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5ndXR0ZXJcbiAgICAgICAgICAgIF07XG4gICAgICAgIG1hcmdpbnMgPSBbXG4gICAgICAgICAgICBndXR0ZXJbMV0sXG4gICAgICAgICAgICBndXR0ZXJbMF0sXG4gICAgICAgICAgICBndXR0ZXJbMV0sXG4gICAgICAgICAgICBndXR0ZXJbMF1cbiAgICAgICAgXTtcbiAgICAgICAgc3BhY2luZyA9IGd1dHRlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBtYXJnaW5zID0gTGF5b3V0VXRpbGl0eS5ub3JtYWxpemVNYXJnaW5zKG9wdGlvbnMubWFyZ2lucyk7XG4gICAgICAgIHNwYWNpbmcgPSBvcHRpb25zLnNwYWNpbmcgfHwgMDtcbiAgICAgICAgc3BhY2luZyA9IEFycmF5LmlzQXJyYXkoc3BhY2luZykgPyBzcGFjaW5nIDogW1xuICAgICAgICAgICAgc3BhY2luZyxcbiAgICAgICAgICAgIHNwYWNpbmdcbiAgICAgICAgXTtcbiAgICB9XG4gICAgbWFyZ2luWzBdID0gbWFyZ2luc1tkaXJlY3Rpb24gPyAwIDogM107XG4gICAgbWFyZ2luWzFdID0gLW1hcmdpbnNbZGlyZWN0aW9uID8gMiA6IDFdO1xuICAgIGp1c3RpZnkgPSBBcnJheS5pc0FycmF5KG9wdGlvbnMuanVzdGlmeSkgPyBvcHRpb25zLmp1c3RpZnkgOiBvcHRpb25zLmp1c3RpZnkgPyBbXG4gICAgICAgIHRydWUsXG4gICAgICAgIHRydWVcbiAgICBdIDogW1xuICAgICAgICBmYWxzZSxcbiAgICAgICAgZmFsc2VcbiAgICBdO1xuICAgIGxpbmVMZW5ndGggPSBzaXplW2xpbmVEaXJlY3Rpb25dIC0gKGRpcmVjdGlvbiA/IG1hcmdpbnNbM10gKyBtYXJnaW5zWzFdIDogbWFyZ2luc1swXSArIG1hcmdpbnNbMl0pO1xuICAgIHZhciBub2RlO1xuICAgIHZhciBub2RlU2l6ZTtcbiAgICB2YXIgbGluZU9mZnNldDtcbiAgICB2YXIgYm91bmQ7XG4gICAgaWYgKCFvcHRpb25zLml0ZW1TaXplKSB7XG4gICAgICAgIGl0ZW1TaXplID0gW1xuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgXTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuaXRlbVNpemUgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICBnZXRJdGVtU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLml0ZW1TaXplWzBdID09PSB1bmRlZmluZWQgfHwgb3B0aW9ucy5pdGVtU2l6ZVswXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGl0ZW1TaXplID0gW1xuICAgICAgICAgICAgb3B0aW9ucy5pdGVtU2l6ZVswXSA9PT0gdW5kZWZpbmVkID8gc2l6ZVswXSA6IG9wdGlvbnMuaXRlbVNpemVbMF0sXG4gICAgICAgICAgICBvcHRpb25zLml0ZW1TaXplWzFdID09PSB1bmRlZmluZWQgPyBzaXplWzFdIDogb3B0aW9ucy5pdGVtU2l6ZVsxXVxuICAgICAgICBdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW1TaXplID0gb3B0aW9ucy5pdGVtU2l6ZTtcbiAgICB9XG4gICAgb2Zmc2V0ID0gY29udGV4dC5zY3JvbGxPZmZzZXQgKyBtYXJnaW5bYWxpZ25tZW50XTtcbiAgICBib3VuZCA9IGNvbnRleHQuc2Nyb2xsRW5kICsgbWFyZ2luW2FsaWdubWVudF07XG4gICAgbGluZU9mZnNldCA9IDA7XG4gICAgbGluZU5vZGVzID0gW107XG4gICAgd2hpbGUgKG9mZnNldCA8IGJvdW5kKSB7XG4gICAgICAgIG5vZGUgPSBjb250ZXh0Lm5leHQoKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICBfbGF5b3V0TGluZSh0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVTaXplID0gX3Jlc29sdmVOb2RlU2l6ZShub2RlKTtcbiAgICAgICAgbGluZU9mZnNldCArPSAobGluZU5vZGVzLmxlbmd0aCA/IHNwYWNpbmdbbGluZURpcmVjdGlvbl0gOiAwKSArIG5vZGVTaXplW2xpbmVEaXJlY3Rpb25dO1xuICAgICAgICBpZiAobGluZU9mZnNldCA+IGxpbmVMZW5ndGgpIHtcbiAgICAgICAgICAgIG9mZnNldCArPSBfbGF5b3V0TGluZSh0cnVlLCAhbm9kZSk7XG4gICAgICAgICAgICBsaW5lT2Zmc2V0ID0gbm9kZVNpemVbbGluZURpcmVjdGlvbl07XG4gICAgICAgIH1cbiAgICAgICAgbGluZU5vZGVzLnB1c2goe1xuICAgICAgICAgICAgbm9kZTogbm9kZSxcbiAgICAgICAgICAgIHNpemU6IG5vZGVTaXplXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBvZmZzZXQgPSBjb250ZXh0LnNjcm9sbE9mZnNldCArIG1hcmdpblthbGlnbm1lbnRdO1xuICAgIGJvdW5kID0gY29udGV4dC5zY3JvbGxTdGFydCArIG1hcmdpblthbGlnbm1lbnRdO1xuICAgIGxpbmVPZmZzZXQgPSAwO1xuICAgIGxpbmVOb2RlcyA9IFtdO1xuICAgIHdoaWxlIChvZmZzZXQgPiBib3VuZCkge1xuICAgICAgICBub2RlID0gY29udGV4dC5wcmV2KCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgX2xheW91dExpbmUoZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZVNpemUgPSBfcmVzb2x2ZU5vZGVTaXplKG5vZGUpO1xuICAgICAgICBsaW5lT2Zmc2V0ICs9IChsaW5lTm9kZXMubGVuZ3RoID8gc3BhY2luZ1tsaW5lRGlyZWN0aW9uXSA6IDApICsgbm9kZVNpemVbbGluZURpcmVjdGlvbl07XG4gICAgICAgIGlmIChsaW5lT2Zmc2V0ID4gbGluZUxlbmd0aCkge1xuICAgICAgICAgICAgb2Zmc2V0IC09IF9sYXlvdXRMaW5lKGZhbHNlLCAhbm9kZSk7XG4gICAgICAgICAgICBsaW5lT2Zmc2V0ID0gbm9kZVNpemVbbGluZURpcmVjdGlvbl07XG4gICAgICAgIH1cbiAgICAgICAgbGluZU5vZGVzLnVuc2hpZnQoe1xuICAgICAgICAgICAgbm9kZTogbm9kZSxcbiAgICAgICAgICAgIHNpemU6IG5vZGVTaXplXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbkNvbGxlY3Rpb25MYXlvdXQuQ2FwYWJpbGl0aWVzID0gY2FwYWJpbGl0aWVzO1xuQ29sbGVjdGlvbkxheW91dC5OYW1lID0gJ0NvbGxlY3Rpb25MYXlvdXQnO1xuQ29sbGVjdGlvbkxheW91dC5EZXNjcmlwdGlvbiA9ICdNdWx0aS1jZWxsIGNvbGxlY3Rpb24tbGF5b3V0IHdpdGggbWFyZ2lucyAmIHNwYWNpbmcnO1xubW9kdWxlLmV4cG9ydHMgPSBDb2xsZWN0aW9uTGF5b3V0O1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIFV0aWxpdHkgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiBudWxsO1xudmFyIGNhcGFiaWxpdGllcyA9IHtcbiAgICAgICAgc2VxdWVuY2U6IHRydWUsXG4gICAgICAgIGRpcmVjdGlvbjogW1xuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWCxcbiAgICAgICAgICAgIFV0aWxpdHkuRGlyZWN0aW9uLllcbiAgICAgICAgXSxcbiAgICAgICAgc2Nyb2xsaW5nOiB0cnVlXG4gICAgfTtcbmZ1bmN0aW9uIENvdmVyTGF5b3V0KGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICB2YXIgbm9kZSA9IGNvbnRleHQubmV4dCgpO1xuICAgIGlmICghbm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBzaXplID0gY29udGV4dC5zaXplO1xuICAgIHZhciBkaXJlY3Rpb24gPSBjb250ZXh0LmRpcmVjdGlvbjtcbiAgICB2YXIgaXRlbVNpemUgPSBvcHRpb25zLml0ZW1TaXplO1xuICAgIHZhciBvcGFjaXR5U3RlcCA9IDAuMjtcbiAgICB2YXIgc2NhbGVTdGVwID0gMC4xO1xuICAgIHZhciB0cmFuc2xhdGVTdGVwID0gMzA7XG4gICAgdmFyIHpTdGFydCA9IDEwMDtcbiAgICBjb250ZXh0LnNldChub2RlLCB7XG4gICAgICAgIHNpemU6IGl0ZW1TaXplLFxuICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgIDAuNSxcbiAgICAgICAgICAgIDAuNVxuICAgICAgICBdLFxuICAgICAgICBhbGlnbjogW1xuICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgMC41XG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICB6U3RhcnRcbiAgICAgICAgXSxcbiAgICAgICAgc2Nyb2xsTGVuZ3RoOiBpdGVtU2l6ZVtkaXJlY3Rpb25dXG4gICAgfSk7XG4gICAgdmFyIHRyYW5zbGF0ZSA9IGl0ZW1TaXplWzBdIC8gMjtcbiAgICB2YXIgb3BhY2l0eSA9IDEgLSBvcGFjaXR5U3RlcDtcbiAgICB2YXIgekluZGV4ID0gelN0YXJ0IC0gMTtcbiAgICB2YXIgc2NhbGUgPSAxIC0gc2NhbGVTdGVwO1xuICAgIHZhciBwcmV2ID0gZmFsc2U7XG4gICAgdmFyIGVuZFJlYWNoZWQgPSBmYWxzZTtcbiAgICBub2RlID0gY29udGV4dC5uZXh0KCk7XG4gICAgaWYgKCFub2RlKSB7XG4gICAgICAgIG5vZGUgPSBjb250ZXh0LnByZXYoKTtcbiAgICAgICAgcHJldiA9IHRydWU7XG4gICAgfVxuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGNvbnRleHQuc2V0KG5vZGUsIHtcbiAgICAgICAgICAgIHNpemU6IGl0ZW1TaXplLFxuICAgICAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgICAgIDAuNVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgICAgIDAuNVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHRyYW5zbGF0ZTogZGlyZWN0aW9uID8gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgcHJldiA/IC10cmFuc2xhdGUgOiB0cmFuc2xhdGUsXG4gICAgICAgICAgICAgICAgekluZGV4XG4gICAgICAgICAgICBdIDogW1xuICAgICAgICAgICAgICAgIHByZXYgPyAtdHJhbnNsYXRlIDogdHJhbnNsYXRlLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgekluZGV4XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgc2NhbGU6IFtcbiAgICAgICAgICAgICAgICBzY2FsZSxcbiAgICAgICAgICAgICAgICBzY2FsZSxcbiAgICAgICAgICAgICAgICAxXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgb3BhY2l0eTogb3BhY2l0eSxcbiAgICAgICAgICAgIHNjcm9sbExlbmd0aDogaXRlbVNpemVbZGlyZWN0aW9uXVxuICAgICAgICB9KTtcbiAgICAgICAgb3BhY2l0eSAtPSBvcGFjaXR5U3RlcDtcbiAgICAgICAgc2NhbGUgLT0gc2NhbGVTdGVwO1xuICAgICAgICB0cmFuc2xhdGUgKz0gdHJhbnNsYXRlU3RlcDtcbiAgICAgICAgekluZGV4LS07XG4gICAgICAgIGlmICh0cmFuc2xhdGUgPj0gc2l6ZVtkaXJlY3Rpb25dIC8gMikge1xuICAgICAgICAgICAgZW5kUmVhY2hlZCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlID0gcHJldiA/IGNvbnRleHQucHJldigpIDogY29udGV4dC5uZXh0KCk7XG4gICAgICAgICAgICBlbmRSZWFjaGVkID0gIW5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVuZFJlYWNoZWQpIHtcbiAgICAgICAgICAgIGlmIChwcmV2KSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbmRSZWFjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICBwcmV2ID0gdHJ1ZTtcbiAgICAgICAgICAgIG5vZGUgPSBjb250ZXh0LnByZXYoKTtcbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNsYXRlID0gaXRlbVNpemVbZGlyZWN0aW9uXSAvIDI7XG4gICAgICAgICAgICAgICAgb3BhY2l0eSA9IDEgLSBvcGFjaXR5U3RlcDtcbiAgICAgICAgICAgICAgICB6SW5kZXggPSB6U3RhcnQgLSAxO1xuICAgICAgICAgICAgICAgIHNjYWxlID0gMSAtIHNjYWxlU3RlcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbkNvdmVyTGF5b3V0LkNhcGFiaWxpdGllcyA9IGNhcGFiaWxpdGllcztcbm1vZHVsZS5leHBvcnRzID0gQ292ZXJMYXlvdXQ7XG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEN1YmVMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBpdGVtU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgY29udGV4dC5zZXQoY29udGV4dC5uZXh0KCksIHtcbiAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgMC41XG4gICAgICAgIF0sXG4gICAgICAgIHJvdGF0ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIE1hdGguUEkgLyAyLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIGl0ZW1TaXplWzBdIC8gMixcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF1cbiAgICB9KTtcbiAgICBjb250ZXh0LnNldChjb250ZXh0Lm5leHQoKSwge1xuICAgICAgICBzaXplOiBpdGVtU2l6ZSxcbiAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAwLjVcbiAgICAgICAgXSxcbiAgICAgICAgcm90YXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgTWF0aC5QSSAvIDIsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgLShpdGVtU2l6ZVswXSAvIDIpLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXVxuICAgIH0pO1xuICAgIGNvbnRleHQuc2V0KGNvbnRleHQubmV4dCgpLCB7XG4gICAgICAgIHNpemU6IGl0ZW1TaXplLFxuICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgIDAuNSxcbiAgICAgICAgICAgIDAuNVxuICAgICAgICBdLFxuICAgICAgICByb3RhdGU6IFtcbiAgICAgICAgICAgIE1hdGguUEkgLyAyLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgLShpdGVtU2l6ZVsxXSAvIDIpLFxuICAgICAgICAgICAgMFxuICAgICAgICBdXG4gICAgfSk7XG4gICAgY29udGV4dC5zZXQoY29udGV4dC5uZXh0KCksIHtcbiAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgMC41XG4gICAgICAgIF0sXG4gICAgICAgIHJvdGF0ZTogW1xuICAgICAgICAgICAgTWF0aC5QSSAvIDIsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICBpdGVtU2l6ZVsxXSAvIDIsXG4gICAgICAgICAgICAwXG4gICAgICAgIF1cbiAgICB9KTtcbn07IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIFV0aWxpdHkgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiBudWxsO1xudmFyIExheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgY2FwYWJpbGl0aWVzID0ge1xuICAgICAgICBzZXF1ZW5jZTogdHJ1ZSxcbiAgICAgICAgZGlyZWN0aW9uOiBbXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5ZLFxuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWFxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxpbmc6IGZhbHNlXG4gICAgfTtcbmZ1bmN0aW9uIEdyaWRMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBzaXplID0gY29udGV4dC5zaXplO1xuICAgIGlmIChvcHRpb25zLmd1dHRlciAhPT0gdW5kZWZpbmVkICYmIGNvbnNvbGUud2Fybikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ2d1dHRlciBoYXMgYmVlbiBkZXByZWNhdGVkIGZvciBHcmlkTGF5b3V0LCB1c2UgbWFyZ2lucyAmIHNwYWNpbmcgaW5zdGVhZCcpO1xuICAgIH1cbiAgICB2YXIgc3BhY2luZztcbiAgICBpZiAob3B0aW9ucy5ndXR0ZXIgJiYgIW9wdGlvbnMuc3BhY2luZykge1xuICAgICAgICBzcGFjaW5nID0gb3B0aW9ucy5ndXR0ZXIgfHwgMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzcGFjaW5nID0gb3B0aW9ucy5zcGFjaW5nIHx8IDA7XG4gICAgfVxuICAgIHNwYWNpbmcgPSBBcnJheS5pc0FycmF5KHNwYWNpbmcpID8gc3BhY2luZyA6IFtcbiAgICAgICAgc3BhY2luZyxcbiAgICAgICAgc3BhY2luZ1xuICAgIF07XG4gICAgdmFyIG1hcmdpbnMgPSBMYXlvdXRVdGlsaXR5Lm5vcm1hbGl6ZU1hcmdpbnMob3B0aW9ucy5tYXJnaW5zKTtcbiAgICB2YXIgbm9kZVNpemUgPSBbXG4gICAgICAgICAgICAoc2l6ZVswXSAtICgob3B0aW9ucy5jZWxsc1swXSAtIDEpICogc3BhY2luZ1swXSArIG1hcmdpbnNbMV0gKyBtYXJnaW5zWzNdKSkgLyBvcHRpb25zLmNlbGxzWzBdLFxuICAgICAgICAgICAgKHNpemVbMV0gLSAoKG9wdGlvbnMuY2VsbHNbMV0gLSAxKSAqIHNwYWNpbmdbMV0gKyBtYXJnaW5zWzBdICsgbWFyZ2luc1syXSkpIC8gb3B0aW9ucy5jZWxsc1sxXVxuICAgICAgICBdO1xuICAgIGZ1bmN0aW9uIF9sYXlvdXROb2RlKG5vZGUsIGNvbCwgcm93KSB7XG4gICAgICAgIGNvbnRleHQuc2V0KG5vZGUsIHtcbiAgICAgICAgICAgIHNpemU6IG5vZGVTaXplLFxuICAgICAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAgICAgKG5vZGVTaXplWzBdICsgc3BhY2luZ1swXSkgKiBjb2wgKyBtYXJnaW5zWzNdLFxuICAgICAgICAgICAgICAgIChub2RlU2l6ZVsxXSArIHNwYWNpbmdbMV0pICogcm93ICsgbWFyZ2luc1swXSxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB2YXIgcm93O1xuICAgIHZhciBjb2w7XG4gICAgdmFyIG5vZGU7XG4gICAgaWYgKGNvbnRleHQuZGlyZWN0aW9uID09PSBVdGlsaXR5LkRpcmVjdGlvbi5ZKSB7XG4gICAgICAgIGZvciAoY29sID0gMDsgY29sIDwgb3B0aW9ucy5jZWxsc1swXTsgY29sKyspIHtcbiAgICAgICAgICAgIGZvciAocm93ID0gMDsgcm93IDwgb3B0aW9ucy5jZWxsc1sxXTsgcm93KyspIHtcbiAgICAgICAgICAgICAgICBub2RlID0gY29udGV4dC5uZXh0KCk7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX2xheW91dE5vZGUobm9kZSwgY29sLCByb3cpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChyb3cgPSAwOyByb3cgPCBvcHRpb25zLmNlbGxzWzFdOyByb3crKykge1xuICAgICAgICAgICAgZm9yIChjb2wgPSAwOyBjb2wgPCBvcHRpb25zLmNlbGxzWzBdOyBjb2wrKykge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBjb250ZXh0Lm5leHQoKTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfbGF5b3V0Tm9kZShub2RlLCBjb2wsIHJvdyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5HcmlkTGF5b3V0LkNhcGFiaWxpdGllcyA9IGNhcGFiaWxpdGllcztcbm1vZHVsZS5leHBvcnRzID0gR3JpZExheW91dDtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsInZhciBMYXlvdXREb2NrSGVscGVyID0gcmVxdWlyZSgnLi4vaGVscGVycy9MYXlvdXREb2NrSGVscGVyJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEhlYWRlckZvb3RlckxheW91dChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGRvY2sgPSBuZXcgTGF5b3V0RG9ja0hlbHBlcihjb250ZXh0LCBvcHRpb25zKTtcbiAgICBkb2NrLnRvcCgnaGVhZGVyJywgb3B0aW9ucy5oZWFkZXJTaXplIHx8IG9wdGlvbnMuaGVhZGVySGVpZ2h0KTtcbiAgICBkb2NrLmJvdHRvbSgnZm9vdGVyJywgb3B0aW9ucy5mb290ZXJTaXplIHx8IG9wdGlvbnMuZm9vdGVySGVpZ2h0KTtcbiAgICBkb2NrLmZpbGwoJ2NvbnRlbnQnKTtcbn07IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xudmFyIFV0aWxpdHkgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiBudWxsO1xudmFyIExheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgY2FwYWJpbGl0aWVzID0ge1xuICAgICAgICBzZXF1ZW5jZTogdHJ1ZSxcbiAgICAgICAgZGlyZWN0aW9uOiBbXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5ZLFxuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWFxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxpbmc6IHRydWUsXG4gICAgICAgIHRydWVTaXplOiB0cnVlLFxuICAgICAgICBzZXF1ZW50aWFsU2Nyb2xsaW5nT3B0aW1pemVkOiB0cnVlXG4gICAgfTtcbnZhciBzZXQgPSB7XG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHNjcm9sbExlbmd0aDogdW5kZWZpbmVkXG4gICAgfTtcbnZhciBtYXJnaW4gPSBbXG4gICAgICAgIDAsXG4gICAgICAgIDBcbiAgICBdO1xuZnVuY3Rpb24gTGlzdExheW91dChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIHNpemUgPSBjb250ZXh0LnNpemU7XG4gICAgdmFyIGRpcmVjdGlvbiA9IGNvbnRleHQuZGlyZWN0aW9uO1xuICAgIHZhciBhbGlnbm1lbnQgPSBjb250ZXh0LmFsaWdubWVudDtcbiAgICB2YXIgcmV2RGlyZWN0aW9uID0gZGlyZWN0aW9uID8gMCA6IDE7XG4gICAgdmFyIG9mZnNldDtcbiAgICB2YXIgbWFyZ2lucyA9IExheW91dFV0aWxpdHkubm9ybWFsaXplTWFyZ2lucyhvcHRpb25zLm1hcmdpbnMpO1xuICAgIHZhciBzcGFjaW5nID0gb3B0aW9ucy5zcGFjaW5nIHx8IDA7XG4gICAgdmFyIG5vZGU7XG4gICAgdmFyIG5vZGVTaXplO1xuICAgIHZhciBpdGVtU2l6ZTtcbiAgICB2YXIgZ2V0SXRlbVNpemU7XG4gICAgdmFyIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGw7XG4gICAgdmFyIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxPZmZzZXQ7XG4gICAgdmFyIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxMZW5ndGg7XG4gICAgdmFyIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxTY3JvbGxMZW5ndGg7XG4gICAgdmFyIGZpcnN0VmlzaWJsZUNlbGw7XG4gICAgdmFyIGxhc3ROb2RlO1xuICAgIHZhciBsYXN0Q2VsbE9mZnNldEluRmlyc3RWaXNpYmxlU2VjdGlvbjtcbiAgICB2YXIgaXNTZWN0aW9uQ2FsbGJhY2sgPSBvcHRpb25zLmlzU2VjdGlvbkNhbGxiYWNrO1xuICAgIHZhciBib3VuZDtcbiAgICBzZXQuc2l6ZVswXSA9IHNpemVbMF07XG4gICAgc2V0LnNpemVbMV0gPSBzaXplWzFdO1xuICAgIHNldC5zaXplW3JldkRpcmVjdGlvbl0gLT0gbWFyZ2luc1sxIC0gcmV2RGlyZWN0aW9uXSArIG1hcmdpbnNbMyAtIHJldkRpcmVjdGlvbl07XG4gICAgc2V0LnRyYW5zbGF0ZVswXSA9IDA7XG4gICAgc2V0LnRyYW5zbGF0ZVsxXSA9IDA7XG4gICAgc2V0LnRyYW5zbGF0ZVsyXSA9IDA7XG4gICAgc2V0LnRyYW5zbGF0ZVtyZXZEaXJlY3Rpb25dID0gbWFyZ2luc1tkaXJlY3Rpb24gPyAzIDogMF07XG4gICAgaWYgKG9wdGlvbnMuaXRlbVNpemUgPT09IHRydWUgfHwgIW9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2l0ZW1TaXplJykpIHtcbiAgICAgICAgaXRlbVNpemUgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5pdGVtU2l6ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIGdldEl0ZW1TaXplID0gb3B0aW9ucy5pdGVtU2l6ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemUgPT09IHVuZGVmaW5lZCA/IHNpemVbZGlyZWN0aW9uXSA6IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgfVxuICAgIG1hcmdpblswXSA9IG1hcmdpbnNbZGlyZWN0aW9uID8gMCA6IDNdO1xuICAgIG1hcmdpblsxXSA9IC1tYXJnaW5zW2RpcmVjdGlvbiA/IDIgOiAxXTtcbiAgICBvZmZzZXQgPSBjb250ZXh0LnNjcm9sbE9mZnNldCArIG1hcmdpblthbGlnbm1lbnRdO1xuICAgIGJvdW5kID0gY29udGV4dC5zY3JvbGxFbmQgKyBtYXJnaW5bYWxpZ25tZW50XTtcbiAgICB3aGlsZSAob2Zmc2V0IDwgYm91bmQpIHtcbiAgICAgICAgbGFzdE5vZGUgPSBub2RlO1xuICAgICAgICBub2RlID0gY29udGV4dC5uZXh0KCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgaWYgKGxhc3ROb2RlICYmICFhbGlnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICBzZXQuc2Nyb2xsTGVuZ3RoID0gbm9kZVNpemUgKyBtYXJnaW5bMF0gKyAtbWFyZ2luWzFdO1xuICAgICAgICAgICAgICAgIGNvbnRleHQuc2V0KGxhc3ROb2RlLCBzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZVNpemUgPSBnZXRJdGVtU2l6ZSA/IGdldEl0ZW1TaXplKG5vZGUucmVuZGVyTm9kZSkgOiBpdGVtU2l6ZTtcbiAgICAgICAgbm9kZVNpemUgPSBub2RlU2l6ZSA9PT0gdHJ1ZSA/IGNvbnRleHQucmVzb2x2ZVNpemUobm9kZSwgc2l6ZSlbZGlyZWN0aW9uXSA6IG5vZGVTaXplO1xuICAgICAgICBzZXQuc2l6ZVtkaXJlY3Rpb25dID0gbm9kZVNpemU7XG4gICAgICAgIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSA9IG9mZnNldCArIChhbGlnbm1lbnQgPyBzcGFjaW5nIDogMCk7XG4gICAgICAgIHNldC5zY3JvbGxMZW5ndGggPSBub2RlU2l6ZSArIHNwYWNpbmc7XG4gICAgICAgIGNvbnRleHQuc2V0KG5vZGUsIHNldCk7XG4gICAgICAgIG9mZnNldCArPSBzZXQuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICBpZiAoaXNTZWN0aW9uQ2FsbGJhY2sgJiYgaXNTZWN0aW9uQ2FsbGJhY2sobm9kZS5yZW5kZXJOb2RlKSkge1xuICAgICAgICAgICAgc2V0LnRyYW5zbGF0ZVtkaXJlY3Rpb25dID0gTWF0aC5tYXgobWFyZ2luWzBdLCBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0pO1xuICAgICAgICAgICAgY29udGV4dC5zZXQobm9kZSwgc2V0KTtcbiAgICAgICAgICAgIGlmICghZmlyc3RWaXNpYmxlQ2VsbCkge1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGwgPSBub2RlO1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxPZmZzZXQgPSBvZmZzZXQgLSBub2RlU2l6ZTtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsTGVuZ3RoID0gbm9kZVNpemU7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbFNjcm9sbExlbmd0aCA9IG5vZGVTaXplO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0Q2VsbE9mZnNldEluRmlyc3RWaXNpYmxlU2VjdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbGFzdENlbGxPZmZzZXRJbkZpcnN0VmlzaWJsZVNlY3Rpb24gPSBvZmZzZXQgLSBub2RlU2l6ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghZmlyc3RWaXNpYmxlQ2VsbCAmJiBvZmZzZXQgPj0gMCkge1xuICAgICAgICAgICAgZmlyc3RWaXNpYmxlQ2VsbCA9IG5vZGU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbm9kZSA9IHVuZGVmaW5lZDtcbiAgICBvZmZzZXQgPSBjb250ZXh0LnNjcm9sbE9mZnNldCArIG1hcmdpblthbGlnbm1lbnRdO1xuICAgIGJvdW5kID0gY29udGV4dC5zY3JvbGxTdGFydCArIG1hcmdpblthbGlnbm1lbnRdO1xuICAgIHdoaWxlIChvZmZzZXQgPiBib3VuZCkge1xuICAgICAgICBsYXN0Tm9kZSA9IG5vZGU7XG4gICAgICAgIG5vZGUgPSBjb250ZXh0LnByZXYoKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICBpZiAobGFzdE5vZGUgJiYgYWxpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgc2V0LnNjcm9sbExlbmd0aCA9IG5vZGVTaXplICsgbWFyZ2luWzBdICsgLW1hcmdpblsxXTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnNldChsYXN0Tm9kZSwgc2V0KTtcbiAgICAgICAgICAgICAgICBpZiAobGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCA9PT0gbGFzdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbFNjcm9sbExlbmd0aCA9IHNldC5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZVNpemUgPSBnZXRJdGVtU2l6ZSA/IGdldEl0ZW1TaXplKG5vZGUucmVuZGVyTm9kZSkgOiBpdGVtU2l6ZTtcbiAgICAgICAgbm9kZVNpemUgPSBub2RlU2l6ZSA9PT0gdHJ1ZSA/IGNvbnRleHQucmVzb2x2ZVNpemUobm9kZSwgc2l6ZSlbZGlyZWN0aW9uXSA6IG5vZGVTaXplO1xuICAgICAgICBzZXQuc2Nyb2xsTGVuZ3RoID0gbm9kZVNpemUgKyBzcGFjaW5nO1xuICAgICAgICBvZmZzZXQgLT0gc2V0LnNjcm9sbExlbmd0aDtcbiAgICAgICAgc2V0LnNpemVbZGlyZWN0aW9uXSA9IG5vZGVTaXplO1xuICAgICAgICBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0gPSBvZmZzZXQgKyAoYWxpZ25tZW50ID8gc3BhY2luZyA6IDApO1xuICAgICAgICBjb250ZXh0LnNldChub2RlLCBzZXQpO1xuICAgICAgICBpZiAoaXNTZWN0aW9uQ2FsbGJhY2sgJiYgaXNTZWN0aW9uQ2FsbGJhY2sobm9kZS5yZW5kZXJOb2RlKSkge1xuICAgICAgICAgICAgc2V0LnRyYW5zbGF0ZVtkaXJlY3Rpb25dID0gTWF0aC5tYXgobWFyZ2luWzBdLCBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0pO1xuICAgICAgICAgICAgY29udGV4dC5zZXQobm9kZSwgc2V0KTtcbiAgICAgICAgICAgIGlmICghbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCkge1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGwgPSBub2RlO1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxPZmZzZXQgPSBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbExlbmd0aCA9IG5vZGVTaXplO1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxTY3JvbGxMZW5ndGggPSBzZXQuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG9mZnNldCArIG5vZGVTaXplID49IDApIHtcbiAgICAgICAgICAgIGZpcnN0VmlzaWJsZUNlbGwgPSBub2RlO1xuICAgICAgICAgICAgaWYgKGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGwpIHtcbiAgICAgICAgICAgICAgICBsYXN0Q2VsbE9mZnNldEluRmlyc3RWaXNpYmxlU2VjdGlvbiA9IG9mZnNldCArIG5vZGVTaXplO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNTZWN0aW9uQ2FsbGJhY2sgJiYgIWxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGwpIHtcbiAgICAgICAgbm9kZSA9IGNvbnRleHQucHJldigpO1xuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgaWYgKGlzU2VjdGlvbkNhbGxiYWNrKG5vZGUucmVuZGVyTm9kZSkpIHtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsID0gbm9kZTtcbiAgICAgICAgICAgICAgICBub2RlU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemUgfHwgY29udGV4dC5yZXNvbHZlU2l6ZShub2RlLCBzaXplKVtkaXJlY3Rpb25dO1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxPZmZzZXQgPSBvZmZzZXQgLSBub2RlU2l6ZTtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsTGVuZ3RoID0gbm9kZVNpemU7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbFNjcm9sbExlbmd0aCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbm9kZSA9IGNvbnRleHQucHJldigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsKSB7XG4gICAgICAgIHZhciBjb3JyZWN0ZWRPZmZzZXQgPSBNYXRoLm1heChtYXJnaW5bMF0sIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxPZmZzZXQpO1xuICAgICAgICBpZiAobGFzdENlbGxPZmZzZXRJbkZpcnN0VmlzaWJsZVNlY3Rpb24gIT09IHVuZGVmaW5lZCAmJiBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsTGVuZ3RoID4gbGFzdENlbGxPZmZzZXRJbkZpcnN0VmlzaWJsZVNlY3Rpb24gLSBtYXJnaW5bMF0pIHtcbiAgICAgICAgICAgIGNvcnJlY3RlZE9mZnNldCA9IGxhc3RDZWxsT2Zmc2V0SW5GaXJzdFZpc2libGVTZWN0aW9uIC0gbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbExlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBzZXQuc2l6ZVtkaXJlY3Rpb25dID0gbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbExlbmd0aDtcbiAgICAgICAgc2V0LnRyYW5zbGF0ZVtkaXJlY3Rpb25dID0gY29ycmVjdGVkT2Zmc2V0O1xuICAgICAgICBzZXQuc2Nyb2xsTGVuZ3RoID0gbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbFNjcm9sbExlbmd0aDtcbiAgICAgICAgY29udGV4dC5zZXQobGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCwgc2V0KTtcbiAgICB9XG59XG5MaXN0TGF5b3V0LkNhcGFiaWxpdGllcyA9IGNhcGFiaWxpdGllcztcbkxpc3RMYXlvdXQuTmFtZSA9ICdMaXN0TGF5b3V0Jztcbkxpc3RMYXlvdXQuRGVzY3JpcHRpb24gPSAnTGlzdC1sYXlvdXQgd2l0aCBtYXJnaW5zLCBzcGFjaW5nIGFuZCBzdGlja3kgaGVhZGVycyc7XG5tb2R1bGUuZXhwb3J0cyA9IExpc3RMYXlvdXQ7XG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCJ2YXIgTGF5b3V0RG9ja0hlbHBlciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvTGF5b3V0RG9ja0hlbHBlcicpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBOYXZCYXJMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBkb2NrID0gbmV3IExheW91dERvY2tIZWxwZXIoY29udGV4dCwge1xuICAgICAgICAgICAgbWFyZ2luczogb3B0aW9ucy5tYXJnaW5zLFxuICAgICAgICAgICAgdHJhbnNsYXRlWjogMVxuICAgICAgICB9KTtcbiAgICBjb250ZXh0LnNldCgnYmFja2dyb3VuZCcsIHsgc2l6ZTogY29udGV4dC5zaXplIH0pO1xuICAgIHZhciBub2RlO1xuICAgIHZhciBpO1xuICAgIHZhciByaWdodEl0ZW1zID0gY29udGV4dC5nZXQoJ3JpZ2h0SXRlbXMnKTtcbiAgICBpZiAocmlnaHRJdGVtcykge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcmlnaHRJdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbm9kZSA9IGNvbnRleHQuZ2V0KHJpZ2h0SXRlbXNbaV0pO1xuICAgICAgICAgICAgZG9jay5yaWdodChub2RlLCBvcHRpb25zLnJpZ2h0SXRlbVdpZHRoIHx8IG9wdGlvbnMuaXRlbVdpZHRoKTtcbiAgICAgICAgICAgIGRvY2sucmlnaHQodW5kZWZpbmVkLCBvcHRpb25zLnJpZ2h0SXRlbVNwYWNlciB8fCBvcHRpb25zLml0ZW1TcGFjZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBsZWZ0SXRlbXMgPSBjb250ZXh0LmdldCgnbGVmdEl0ZW1zJyk7XG4gICAgaWYgKGxlZnRJdGVtcykge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVmdEl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlID0gY29udGV4dC5nZXQobGVmdEl0ZW1zW2ldKTtcbiAgICAgICAgICAgIGRvY2subGVmdChub2RlLCBvcHRpb25zLmxlZnRJdGVtV2lkdGggfHwgb3B0aW9ucy5pdGVtV2lkdGgpO1xuICAgICAgICAgICAgZG9jay5sZWZ0KHVuZGVmaW5lZCwgb3B0aW9ucy5sZWZ0SXRlbVNwYWNlciB8fCBvcHRpb25zLml0ZW1TcGFjZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRvY2suZmlsbCgndGl0bGUnKTtcbn07Il19
