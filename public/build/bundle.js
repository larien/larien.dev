
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function set_svg_attributes(node, attributes) {
        for (const key in attributes) {
            attr(node, key, attributes[key]);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function claim_element(nodes, name, attributes, svg) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeName === name) {
                let j = 0;
                const remove = [];
                while (j < node.attributes.length) {
                    const attribute = node.attributes[j++];
                    if (!attributes[attribute.name]) {
                        remove.push(attribute.name);
                    }
                }
                for (let k = 0; k < remove.length; k++) {
                    node.removeAttribute(remove[k]);
                }
                return nodes.splice(i, 1)[0];
            }
        }
        return svg ? svg_element(name) : element(name);
    }
    function claim_text(nodes, data) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeType === 3) {
                node.data = '' + data;
                return nodes.splice(i, 1)[0];
            }
        }
        return text(data);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* public/logo.svg generated by Svelte v3.24.0 */

    function create_fragment(ctx) {
    	let svg;
    	let defs;
    	let style;
    	let t0;
    	let title;
    	let t1;
    	let path;
    	let polygon;
    	let rect0;
    	let rect1;
    	let rect2;
    	let rect3;
    	let rect4;
    	let rect5;

    	let svg_levels = [
    		{ id: "Logo" },
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ viewBox: "0 0 962 962" },
    		/*$$props*/ ctx[0]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	return {
    		c() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			style = svg_element("style");
    			t0 = text(".cls-1{fill:none;}.cls-2{fill:#1da1eb;}");
    			title = svg_element("title");
    			t1 = text("logoLogo");
    			path = svg_element("path");
    			polygon = svg_element("polygon");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			rect3 = svg_element("rect");
    			rect4 = svg_element("rect");
    			rect5 = svg_element("rect");
    			this.h();
    		},
    		l(nodes) {
    			svg = claim_element(nodes, "svg", { id: true, xmlns: true, viewBox: true }, 1);
    			var svg_nodes = children(svg);
    			defs = claim_element(svg_nodes, "defs", {}, 1);
    			var defs_nodes = children(defs);
    			style = claim_element(defs_nodes, "style", {}, 1);
    			var style_nodes = children(style);
    			t0 = claim_text(style_nodes, ".cls-1{fill:none;}.cls-2{fill:#1da1eb;}");
    			style_nodes.forEach(detach);
    			defs_nodes.forEach(detach);
    			title = claim_element(svg_nodes, "title", {}, 1);
    			var title_nodes = children(title);
    			t1 = claim_text(title_nodes, "logoLogo");
    			title_nodes.forEach(detach);
    			path = claim_element(svg_nodes, "path", { class: true, d: true, transform: true }, 1);
    			children(path).forEach(detach);
    			polygon = claim_element(svg_nodes, "polygon", { class: true, points: true }, 1);
    			children(polygon).forEach(detach);
    			rect0 = claim_element(svg_nodes, "rect", { class: true, width: true, height: true }, 1);
    			children(rect0).forEach(detach);

    			rect1 = claim_element(
    				svg_nodes,
    				"rect",
    				{
    					class: true,
    					y: true,
    					width: true,
    					height: true
    				},
    				1
    			);

    			children(rect1).forEach(detach);

    			rect2 = claim_element(
    				svg_nodes,
    				"rect",
    				{
    					class: true,
    					x: true,
    					width: true,
    					height: true
    				},
    				1
    			);

    			children(rect2).forEach(detach);

    			rect3 = claim_element(
    				svg_nodes,
    				"rect",
    				{
    					class: true,
    					x: true,
    					width: true,
    					height: true
    				},
    				1
    			);

    			children(rect3).forEach(detach);

    			rect4 = claim_element(
    				svg_nodes,
    				"rect",
    				{
    					class: true,
    					x: true,
    					y: true,
    					width: true,
    					height: true
    				},
    				1
    			);

    			children(rect4).forEach(detach);

    			rect5 = claim_element(
    				svg_nodes,
    				"rect",
    				{
    					class: true,
    					x: true,
    					y: true,
    					width: true,
    					height: true
    				},
    				1
    			);

    			children(rect5).forEach(detach);
    			svg_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(path, "class", "cls-1");
    			attr(path, "d", "M563,1019v0Z");
    			attr(path, "transform", "translate(-563 -57)");
    			attr(polygon, "class", "cls-1");
    			attr(polygon, "points", "962 962 962 785.02 173.47 785.02 173.47 0 0 0 0 962 962 962");
    			attr(rect0, "class", "cls-2");
    			attr(rect0, "width", "173.48");
    			attr(rect0, "height", "962");
    			attr(rect1, "class", "cls-2");
    			attr(rect1, "y", "785.02");
    			attr(rect1, "width", "962");
    			attr(rect1, "height", "176.98");
    			attr(rect2, "class", "cls-2");
    			attr(rect2, "x", "262.84");
    			attr(rect2, "width", "699.16");
    			attr(rect2, "height", "173.48");
    			attr(rect3, "class", "cls-2");
    			attr(rect3, "x", "788.52");
    			attr(rect3, "width", "173.48");
    			attr(rect3, "height", "700.91");
    			attr(rect4, "class", "cls-2");
    			attr(rect4, "x", "262.84");
    			attr(rect4, "y", "261.09");
    			attr(rect4, "width", "697.16");
    			attr(rect4, "height", "175.23");
    			attr(rect5, "class", "cls-2");
    			attr(rect5, "x", "262.84");
    			attr(rect5, "y", "523.93");
    			attr(rect5, "width", "697.16");
    			attr(rect5, "height", "176.98");
    			set_svg_attributes(svg, svg_data);
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, defs);
    			append(defs, style);
    			append(style, t0);
    			append(svg, title);
    			append(title, t1);
    			append(svg, path);
    			append(svg, polygon);
    			append(svg, rect0);
    			append(svg, rect1);
    			append(svg, rect2);
    			append(svg, rect3);
    			append(svg, rect4);
    			append(svg, rect5);
    		},
    		p(ctx, [dirty]) {
    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ id: "Logo" },
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ viewBox: "0 0 962 962" },
    				dirty & /*$$props*/ 1 && /*$$props*/ ctx[0]
    			]));
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	$$self.$set = $$new_props => {
    		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    	};

    	$$props = exclude_internal_props($$props);
    	return [$$props];
    }

    class Logo extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {});
    	}
    }

    /* src/components/Logo.svelte generated by Svelte v3.24.0 */
    const file = "src/components/Logo.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let logo;
    	let current;

    	logo = new Logo({
    			props: { height: /*height*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(logo.$$.fragment);
    			attr_dev(div, "class", "logo svelte-c2p9gc");
    			add_location(div, file, 6, 0, 88);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(logo, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const logo_changes = {};
    			if (dirty & /*height*/ 1) logo_changes.height = /*height*/ ctx[0];
    			logo.$set(logo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(logo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { height } = $$props;
    	const writable_props = ["height"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Logo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Logo", $$slots, []);

    	$$self.$set = $$props => {
    		if ("height" in $$props) $$invalidate(0, height = $$props.height);
    	};

    	$$self.$capture_state = () => ({ Logo, height });

    	$$self.$inject_state = $$props => {
    		if ("height" in $$props) $$invalidate(0, height = $$props.height);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [height];
    }

    class Logo_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { height: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Logo_1",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*height*/ ctx[0] === undefined && !("height" in props)) {
    			console.warn("<Logo> was created without expected prop 'height'");
    		}
    	}

    	get height() {
    		throw new Error("<Logo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Logo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layout/header/Header.svelte generated by Svelte v3.24.0 */
    const file$1 = "src/layout/header/Header.svelte";

    function create_fragment$2(ctx) {
    	let section;
    	let logo;
    	let current;
    	logo = new Logo_1({ props: { height: "50" }, $$inline: true });

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(logo.$$.fragment);
    			attr_dev(section, "id", "header");
    			attr_dev(section, "class", "svelte-4fx93g");
    			add_location(section, file$1, 4, 0, 72);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(logo, section, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(logo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);
    	$$self.$capture_state = () => ({ Logo: Logo_1 });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/layout/body/Body.svelte generated by Svelte v3.24.0 */
    const file$2 = "src/layout/body/Body.svelte";

    // (46:8) {#if toggleLanguage}
    function create_if_block_3(ctx) {
    	let t0;
    	let t1;
    	let if_block2_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*language*/ ctx[0] == "pt") return create_if_block_6;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*language*/ ctx[0] == "en") return create_if_block_5;
    		return create_else_block_1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*language*/ ctx[0] == "es") return create_if_block_4;
    		return create_else_block;
    	}

    	let current_block_type_2 = select_block_type_2(ctx);
    	let if_block2 = current_block_type_2(ctx);

    	const block = {
    		c: function create() {
    			if_block0.c();
    			t0 = space();
    			if_block1.c();
    			t1 = space();
    			if_block2.c();
    			if_block2_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			}

    			if (current_block_type_2 === (current_block_type_2 = select_block_type_2(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_2(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(46:8) {#if toggleLanguage}",
    		ctx
    	});

    	return block;
    }

    // (49:12) {:else}
    function create_else_block_2(ctx) {
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "PT";
    			add_location(p, file$2, 49, 16, 1260);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = listen_dev(p, "click", /*selectPt*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(49:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (47:12) {#if language == "pt"}
    function create_if_block_6(ctx) {
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "PT";
    			attr_dev(p, "class", "selected svelte-tchylh");
    			add_location(p, file$2, 47, 16, 1177);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = listen_dev(p, "click", /*selectPt*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(47:12) {#if language == \\\"pt\\\"}",
    		ctx
    	});

    	return block;
    }

    // (54:12) {:else}
    function create_else_block_1(ctx) {
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "EN";
    			add_location(p, file$2, 54, 16, 1442);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = listen_dev(p, "click", /*selectEn*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(54:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (52:12) {#if language == "en"}
    function create_if_block_5(ctx) {
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "EN";
    			attr_dev(p, "class", "selected svelte-tchylh");
    			add_location(p, file$2, 52, 16, 1359);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = listen_dev(p, "click", /*selectEn*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(52:12) {#if language == \\\"en\\\"}",
    		ctx
    	});

    	return block;
    }

    // (59:12) {:else}
    function create_else_block(ctx) {
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "ES";
    			add_location(p, file$2, 59, 16, 1624);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = listen_dev(p, "click", /*selectEs*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(59:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (57:12) {#if language == "es"}
    function create_if_block_4(ctx) {
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "ES";
    			attr_dev(p, "class", "selected svelte-tchylh");
    			add_location(p, file$2, 57, 16, 1541);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (!mounted) {
    				dispose = listen_dev(p, "click", /*selectEs*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(57:12) {#if language == \\\"es\\\"}",
    		ctx
    	});

    	return block;
    }

    // (77:35) 
    function create_if_block_2(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t2;
    	let strong0;
    	let t4;
    	let t5;
    	let p2;
    	let t6;
    	let strong1;
    	let t9;
    	let t10;
    	let p3;
    	let t12;
    	let p4;
    	let t13;
    	let strong2;
    	let t15;
    	let strong3;
    	let t17;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "¡Hola!";
    			t1 = space();
    			p1 = element("p");
    			t2 = text("Soy ");
    			strong0 = element("strong");
    			strong0.textContent = "Lauren";
    			t4 = text(".");
    			t5 = space();
    			p2 = element("p");
    			t6 = text("Tengo ");
    			strong1 = element("strong");
    			strong1.textContent = `${/*age*/ ctx[3]} años`;
    			t9 = text(" y soy");
    			t10 = space();
    			p3 = element("p");
    			p3.textContent = "~typewriter~";
    			t12 = space();
    			p4 = element("p");
    			t13 = text("de ");
    			strong2 = element("strong");
    			strong2.textContent = "São Paulo";
    			t15 = text(", ");
    			strong3 = element("strong");
    			strong3.textContent = "Brasil";
    			t17 = text(".");
    			add_location(p0, file$2, 77, 12, 2465);
    			attr_dev(strong0, "class", "highlight svelte-tchylh");
    			add_location(strong0, file$2, 78, 19, 2498);
    			add_location(p1, file$2, 78, 12, 2491);
    			attr_dev(strong1, "class", "highlight svelte-tchylh");
    			add_location(strong1, file$2, 79, 21, 2566);
    			add_location(p2, file$2, 79, 12, 2557);
    			add_location(p3, file$2, 80, 12, 2634);
    			attr_dev(strong2, "class", "highlight svelte-tchylh");
    			add_location(strong2, file$2, 81, 18, 2672);
    			attr_dev(strong3, "class", "highlight svelte-tchylh");
    			add_location(strong3, file$2, 81, 64, 2718);
    			add_location(p4, file$2, 81, 12, 2666);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t2);
    			append_dev(p1, strong0);
    			append_dev(p1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t6);
    			append_dev(p2, strong1);
    			append_dev(p2, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t13);
    			append_dev(p4, strong2);
    			append_dev(p4, t15);
    			append_dev(p4, strong3);
    			append_dev(p4, t17);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(p4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(77:35) ",
    		ctx
    	});

    	return block;
    }

    // (71:35) 
    function create_if_block_1(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t2;
    	let strong0;
    	let t4;
    	let p2;
    	let t5;
    	let strong1;
    	let t8;
    	let p3;
    	let t10;
    	let p4;
    	let t11;
    	let strong2;
    	let t13;
    	let strong3;
    	let t15;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Hey!";
    			t1 = space();
    			p1 = element("p");
    			t2 = text("My name is ");
    			strong0 = element("strong");
    			strong0.textContent = "Lauren";
    			t4 = space();
    			p2 = element("p");
    			t5 = text("and I'm a ");
    			strong1 = element("strong");
    			strong1.textContent = `${/*age*/ ctx[3]} year old`;
    			t8 = space();
    			p3 = element("p");
    			p3.textContent = "~typewriter~";
    			t10 = space();
    			p4 = element("p");
    			t11 = text("based in ");
    			strong2 = element("strong");
    			strong2.textContent = "São Paulo";
    			t13 = text(", ");
    			strong3 = element("strong");
    			strong3.textContent = "Brazil";
    			t15 = text(".");
    			add_location(p0, file$2, 71, 12, 2105);
    			attr_dev(strong0, "class", "highlight svelte-tchylh");
    			add_location(strong0, file$2, 72, 26, 2143);
    			add_location(p1, file$2, 72, 12, 2129);
    			attr_dev(strong1, "class", "highlight svelte-tchylh");
    			add_location(strong1, file$2, 73, 25, 2214);
    			add_location(p2, file$2, 73, 12, 2201);
    			add_location(p3, file$2, 74, 12, 2280);
    			attr_dev(strong2, "class", "highlight svelte-tchylh");
    			add_location(strong2, file$2, 75, 24, 2324);
    			attr_dev(strong3, "class", "highlight svelte-tchylh");
    			add_location(strong3, file$2, 75, 70, 2370);
    			add_location(p4, file$2, 75, 12, 2312);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t2);
    			append_dev(p1, strong0);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t5);
    			append_dev(p2, strong1);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t11);
    			append_dev(p4, strong2);
    			append_dev(p4, t13);
    			append_dev(p4, strong3);
    			append_dev(p4, t15);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(p4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(71:35) ",
    		ctx
    	});

    	return block;
    }

    // (65:8) {#if language == "pt"}
    function create_if_block(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t2;
    	let strong0;
    	let t4;
    	let t5;
    	let p2;
    	let t6;
    	let strong1;
    	let t9;
    	let t10;
    	let p3;
    	let t12;
    	let p4;
    	let t13;
    	let strong2;
    	let t15;
    	let strong3;
    	let t17;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Olá!";
    			t1 = space();
    			p1 = element("p");
    			t2 = text("Meu nome é ");
    			strong0 = element("strong");
    			strong0.textContent = "Lauren";
    			t4 = text(".");
    			t5 = space();
    			p2 = element("p");
    			t6 = text("Tenho ");
    			strong1 = element("strong");
    			strong1.textContent = `${/*age*/ ctx[3]} anos`;
    			t9 = text(" e sou uma");
    			t10 = space();
    			p3 = element("p");
    			p3.textContent = "~typewriter~";
    			t12 = space();
    			p4 = element("p");
    			t13 = text("de ");
    			strong2 = element("strong");
    			strong2.textContent = "São Paulo";
    			t15 = text(", ");
    			strong3 = element("strong");
    			strong3.textContent = "Brasil";
    			t17 = text(".");
    			add_location(p0, file$2, 65, 12, 1748);
    			attr_dev(strong0, "class", "highlight svelte-tchylh");
    			add_location(strong0, file$2, 66, 26, 1786);
    			add_location(p1, file$2, 66, 12, 1772);
    			attr_dev(strong1, "class", "highlight svelte-tchylh");
    			add_location(strong1, file$2, 67, 21, 1854);
    			add_location(p2, file$2, 67, 12, 1845);
    			add_location(p3, file$2, 68, 12, 1926);
    			attr_dev(strong2, "class", "highlight svelte-tchylh");
    			add_location(strong2, file$2, 69, 18, 1964);
    			attr_dev(strong3, "class", "highlight svelte-tchylh");
    			add_location(strong3, file$2, 69, 64, 2010);
    			add_location(p4, file$2, 69, 12, 1958);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t2);
    			append_dev(p1, strong0);
    			append_dev(p1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t6);
    			append_dev(p2, strong1);
    			append_dev(p2, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t13);
    			append_dev(p4, strong2);
    			append_dev(p4, t15);
    			append_dev(p4, strong3);
    			append_dev(p4, t17);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(p4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(65:8) {#if language == \\\"pt\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let section;
    	let h4;
    	let i;
    	let t0;
    	let h4_class_value;
    	let t1;
    	let h1;
    	let mounted;
    	let dispose;
    	let if_block0 = /*toggleLanguage*/ ctx[1] && create_if_block_3(ctx);

    	function select_block_type_3(ctx, dirty) {
    		if (/*language*/ ctx[0] == "pt") return create_if_block;
    		if (/*language*/ ctx[0] == "en") return create_if_block_1;
    		if (/*language*/ ctx[0] == "es") return create_if_block_2;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block1 = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			h4 = element("h4");
    			i = element("i");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			h1 = element("h1");
    			if (if_block1) if_block1.c();
    			attr_dev(i, "title", /*changeLanguage*/ ctx[2]);
    			attr_dev(i, "class", "fa fa-language svelte-tchylh");
    			add_location(i, file$2, 44, 8, 1021);
    			attr_dev(h4, "class", h4_class_value = "languages " + /*language*/ ctx[0] + " svelte-tchylh");
    			add_location(h4, file$2, 43, 4, 975);
    			attr_dev(h1, "class", "svelte-tchylh");
    			add_location(h1, file$2, 63, 4, 1700);
    			attr_dev(section, "id", "body");
    			attr_dev(section, "class", "svelte-tchylh");
    			add_location(section, file$2, 42, 0, 951);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h4);
    			append_dev(h4, i);
    			append_dev(h4, t0);
    			if (if_block0) if_block0.m(h4, null);
    			append_dev(section, t1);
    			append_dev(section, h1);
    			if (if_block1) if_block1.m(h1, null);

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*toggleLang*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*changeLanguage*/ 4) {
    				attr_dev(i, "title", /*changeLanguage*/ ctx[2]);
    			}

    			if (/*toggleLanguage*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(h4, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*language*/ 1 && h4_class_value !== (h4_class_value = "languages " + /*language*/ ctx[0] + " svelte-tchylh")) {
    				attr_dev(h4, "class", h4_class_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if (if_block1) if_block1.d(1);
    				if_block1 = current_block_type && current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(h1, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block0) if_block0.d();

    			if (if_block1) {
    				if_block1.d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let birth = new Date("1997/07/05");
    	let current = new Date();
    	let diff = current - birth;
    	let age = Math.floor(diff / 31557600000); // divide by 1000*60*60*24*365.25
    	let language = "pt";
    	let toggleLanguage = false;
    	let selectable = true;

    	let changeLanguages = {
    		"pt": "Mudar o idioma",
    		"en": "Change language",
    		"es": "Cambiar el idioma"
    	};

    	let changeLanguage = changeLanguages[language];

    	function selectEn() {
    		$$invalidate(0, language = "en");
    		$$invalidate(2, changeLanguage = changeLanguages[language]);
    	}

    	function selectPt() {
    		$$invalidate(0, language = "pt");
    		$$invalidate(2, changeLanguage = changeLanguages[language]);
    	}

    	function selectEs() {
    		$$invalidate(0, language = "es");
    		$$invalidate(2, changeLanguage = changeLanguages[language]);
    	}

    	function toggleLang() {
    		$$invalidate(1, toggleLanguage = !toggleLanguage);
    		selectable = true;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Body> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Body", $$slots, []);

    	$$self.$capture_state = () => ({
    		slide,
    		birth,
    		current,
    		diff,
    		age,
    		language,
    		toggleLanguage,
    		selectable,
    		changeLanguages,
    		changeLanguage,
    		selectEn,
    		selectPt,
    		selectEs,
    		toggleLang
    	});

    	$$self.$inject_state = $$props => {
    		if ("birth" in $$props) birth = $$props.birth;
    		if ("current" in $$props) current = $$props.current;
    		if ("diff" in $$props) diff = $$props.diff;
    		if ("age" in $$props) $$invalidate(3, age = $$props.age);
    		if ("language" in $$props) $$invalidate(0, language = $$props.language);
    		if ("toggleLanguage" in $$props) $$invalidate(1, toggleLanguage = $$props.toggleLanguage);
    		if ("selectable" in $$props) selectable = $$props.selectable;
    		if ("changeLanguages" in $$props) changeLanguages = $$props.changeLanguages;
    		if ("changeLanguage" in $$props) $$invalidate(2, changeLanguage = $$props.changeLanguage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		language,
    		toggleLanguage,
    		changeLanguage,
    		age,
    		selectEn,
    		selectPt,
    		selectEs,
    		toggleLang
    	];
    }

    class Body extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Body",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* node_modules/svelte-flex/src/Flex.svelte generated by Svelte v3.24.0 */

    const file$3 = "node_modules/svelte-flex/src/Flex.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);
    	let div_levels = [/*$$restProps*/ ctx[1], { class: /*className*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			toggle_class(div, "svelte-f66dpe", true);
    			add_location(div, file$3, 70, 0, 1526);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 64) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*className*/ 1) && { class: /*className*/ ctx[0] }
    			]));

    			toggle_class(div, "svelte-f66dpe", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const omit_props_names = ["direction","align","justify","reverse"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { direction = "row" } = $$props;
    	let { align = "center" } = $$props;
    	let { justify = "center" } = $$props;
    	let { reverse = false } = $$props;
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Flex", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("direction" in $$new_props) $$invalidate(2, direction = $$new_props.direction);
    		if ("align" in $$new_props) $$invalidate(3, align = $$new_props.align);
    		if ("justify" in $$new_props) $$invalidate(4, justify = $$new_props.justify);
    		if ("reverse" in $$new_props) $$invalidate(5, reverse = $$new_props.reverse);
    		if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		direction,
    		align,
    		justify,
    		reverse,
    		className
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("direction" in $$props) $$invalidate(2, direction = $$new_props.direction);
    		if ("align" in $$props) $$invalidate(3, align = $$new_props.align);
    		if ("justify" in $$props) $$invalidate(4, justify = $$new_props.justify);
    		if ("reverse" in $$props) $$invalidate(5, reverse = $$new_props.reverse);
    		if ("className" in $$props) $$invalidate(0, className = $$new_props.className);
    	};

    	let className;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(0, className = [
    			"flex",
    			`flex-direction--${direction}${reverse ? "--reverse" : ""}`,
    			`flex-align--${align}`,
    			`flex-justify--${justify}`,
    			//  Apply any additional/custom classNames, if provided
    			$$restProps.class ? $$restProps.class : ""
    		].join(" "));
    	};

    	return [className, $$restProps, direction, align, justify, reverse, $$scope, $$slots];
    }

    class Flex extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			direction: 2,
    			align: 3,
    			justify: 4,
    			reverse: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Flex",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get direction() {
    		throw new Error("<Flex>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set direction(value) {
    		throw new Error("<Flex>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get align() {
    		throw new Error("<Flex>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set align(value) {
    		throw new Error("<Flex>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get justify() {
    		throw new Error("<Flex>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set justify(value) {
    		throw new Error("<Flex>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reverse() {
    		throw new Error("<Flex>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reverse(value) {
    		throw new Error("<Flex>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Copyright.svelte generated by Svelte v3.24.0 */

    const file$4 = "src/components/Copyright.svelte";

    function create_fragment$5(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = `© ${/*year*/ ctx[0]} Lauren Ferreira`;
    			attr_dev(p, "class", "svelte-i1exto");
    			add_location(p, file$4, 6, 0, 96);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let currentDate = new Date();
    	let year = currentDate.getFullYear();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Copyright> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Copyright", $$slots, []);
    	$$self.$capture_state = () => ({ currentDate, year });

    	$$self.$inject_state = $$props => {
    		if ("currentDate" in $$props) currentDate = $$props.currentDate;
    		if ("year" in $$props) $$invalidate(0, year = $$props.year);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [year];
    }

    class Copyright extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Copyright",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/ContactIcon.svelte generated by Svelte v3.24.0 */

    const file$5 = "src/components/ContactIcon.svelte";

    // (27:31) 
    function create_if_block_3$1(ctx) {
    	let a;
    	let i;

    	const block = {
    		c: function create() {
    			a = element("a");
    			i = element("i");
    			attr_dev(i, "class", "fa fa-github");
    			add_location(i, file$5, 31, 12, 829);
    			attr_dev(a, "title", "GitHub page");
    			attr_dev(a, "href", "https://github.com/larien");
    			attr_dev(a, "class", "svelte-1jbdpm");
    			add_location(a, file$5, 27, 8, 723);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(27:31) ",
    		ctx
    	});

    	return block;
    }

    // (20:32) 
    function create_if_block_2$1(ctx) {
    	let a;
    	let i;

    	const block = {
    		c: function create() {
    			a = element("a");
    			i = element("i");
    			attr_dev(i, "class", "fa fa-twitter");
    			add_location(i, file$5, 24, 12, 640);
    			attr_dev(a, "title", "Twitter page");
    			attr_dev(a, "href", "http://www.twitter.com/larienmf");
    			attr_dev(a, "class", "svelte-1jbdpm");
    			add_location(a, file$5, 20, 8, 527);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(20:32) ",
    		ctx
    	});

    	return block;
    }

    // (13:33) 
    function create_if_block_1$1(ctx) {
    	let a;
    	let i;

    	const block = {
    		c: function create() {
    			a = element("a");
    			i = element("i");
    			attr_dev(i, "class", "fa fa-linkedin");
    			add_location(i, file$5, 17, 12, 442);
    			attr_dev(a, "title", "LinkedIn page");
    			attr_dev(a, "href", "https://www.linkedin.com/in/lauren-ferreira-9836914b/");
    			attr_dev(a, "class", "svelte-1jbdpm");
    			add_location(a, file$5, 13, 8, 306);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(13:33) ",
    		ctx
    	});

    	return block;
    }

    // (6:4) {#if icon == "email"}
    function create_if_block$1(ctx) {
    	let a;
    	let i;

    	const block = {
    		c: function create() {
    			a = element("a");
    			i = element("i");
    			attr_dev(i, "class", "fa fa-envelope");
    			add_location(i, file$5, 10, 12, 220);
    			attr_dev(a, "title", "E-mail address");
    			attr_dev(a, "href", "mailto:lauren.ferremch@gmail.com");
    			attr_dev(a, "class", "svelte-1jbdpm");
    			add_location(a, file$5, 6, 8, 104);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(6:4) {#if icon == \\\"email\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let div_class_value;

    	function select_block_type(ctx, dirty) {
    		if (/*icon*/ ctx[0] == "email") return create_if_block$1;
    		if (/*icon*/ ctx[0] == "linkedin") return create_if_block_1$1;
    		if (/*icon*/ ctx[0] == "twitter") return create_if_block_2$1;
    		if (/*icon*/ ctx[0] == "github") return create_if_block_3$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", div_class_value = "contact " + /*icon*/ ctx[0] + " svelte-1jbdpm");
    			add_location(div, file$5, 4, 0, 41);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (dirty & /*icon*/ 1 && div_class_value !== (div_class_value = "contact " + /*icon*/ ctx[0] + " svelte-1jbdpm")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { icon } = $$props;
    	const writable_props = ["icon"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ContactIcon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ContactIcon", $$slots, []);

    	$$self.$set = $$props => {
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    	};

    	$$self.$capture_state = () => ({ icon });

    	$$self.$inject_state = $$props => {
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [icon];
    }

    class ContactIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { icon: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContactIcon",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[0] === undefined && !("icon" in props)) {
    			console.warn("<ContactIcon> was created without expected prop 'icon'");
    		}
    	}

    	get icon() {
    		throw new Error("<ContactIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<ContactIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Version.svelte generated by Svelte v3.24.0 */

    const file$6 = "src/components/Version.svelte";

    function create_fragment$7(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "v1.0";
    			attr_dev(p, "class", "svelte-15aefnf");
    			add_location(p, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Version> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Version", $$slots, []);
    	return [];
    }

    class Version extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Version",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/layout/footer/Footer.svelte generated by Svelte v3.24.0 */
    const file$7 = "src/layout/footer/Footer.svelte";

    // (10:4) <Flex direction="row" align="center">
    function create_default_slot(ctx) {
    	let contacticon0;
    	let t0;
    	let contacticon1;
    	let t1;
    	let contacticon2;
    	let t2;
    	let contacticon3;
    	let current;

    	contacticon0 = new ContactIcon({
    			props: { icon: "github" },
    			$$inline: true
    		});

    	contacticon1 = new ContactIcon({
    			props: { icon: "twitter" },
    			$$inline: true
    		});

    	contacticon2 = new ContactIcon({ props: { icon: "email" }, $$inline: true });

    	contacticon3 = new ContactIcon({
    			props: { icon: "linkedin" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(contacticon0.$$.fragment);
    			t0 = space();
    			create_component(contacticon1.$$.fragment);
    			t1 = space();
    			create_component(contacticon2.$$.fragment);
    			t2 = space();
    			create_component(contacticon3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(contacticon0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(contacticon1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(contacticon2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(contacticon3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contacticon0.$$.fragment, local);
    			transition_in(contacticon1.$$.fragment, local);
    			transition_in(contacticon2.$$.fragment, local);
    			transition_in(contacticon3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contacticon0.$$.fragment, local);
    			transition_out(contacticon1.$$.fragment, local);
    			transition_out(contacticon2.$$.fragment, local);
    			transition_out(contacticon3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(contacticon0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(contacticon1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(contacticon2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(contacticon3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(10:4) <Flex direction=\\\"row\\\" align=\\\"center\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let section;
    	let copyright;
    	let t0;
    	let flex;
    	let t1;
    	let version;
    	let current;
    	copyright = new Copyright({ $$inline: true });

    	flex = new Flex({
    			props: {
    				direction: "row",
    				align: "center",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	version = new Version({ $$inline: true });

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(copyright.$$.fragment);
    			t0 = space();
    			create_component(flex.$$.fragment);
    			t1 = space();
    			create_component(version.$$.fragment);
    			attr_dev(section, "id", "footer");
    			attr_dev(section, "class", "svelte-1gcu89c");
    			add_location(section, file$7, 7, 0, 242);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(copyright, section, null);
    			append_dev(section, t0);
    			mount_component(flex, section, null);
    			append_dev(section, t1);
    			mount_component(version, section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const flex_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				flex_changes.$$scope = { dirty, ctx };
    			}

    			flex.$set(flex_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(copyright.$$.fragment, local);
    			transition_in(flex.$$.fragment, local);
    			transition_in(version.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(copyright.$$.fragment, local);
    			transition_out(flex.$$.fragment, local);
    			transition_out(version.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(copyright);
    			destroy_component(flex);
    			destroy_component(version);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Footer", $$slots, []);
    	$$self.$capture_state = () => ({ Flex, Copyright, ContactIcon, Version });
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.0 */
    const file$8 = "src/App.svelte";

    function create_fragment$9(ctx) {
    	let link0;
    	let t0;
    	let link1;
    	let t1;
    	let i;
    	let t2;
    	let header;
    	let t3;
    	let body;
    	let t4;
    	let footer;
    	let current;
    	let mounted;
    	let dispose;
    	header = new Header({ $$inline: true });
    	body = new Body({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			t0 = space();
    			link1 = element("link");
    			t1 = space();
    			i = element("i");
    			t2 = space();
    			create_component(header.$$.fragment);
    			t3 = space();
    			create_component(body.$$.fragment);
    			t4 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(link0, "rel", "stylesheet");
    			attr_dev(link0, "href", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");
    			attr_dev(link0, "class", "svelte-z2n8iw");
    			add_location(link0, file$8, 17, 0, 395);
    			attr_dev(link1, "href", "https://fonts.googleapis.com/css?family=Coda");
    			attr_dev(link1, "rel", "stylesheet");
    			attr_dev(link1, "class", "svelte-z2n8iw");
    			add_location(link1, file$8, 18, 0, 509);
    			attr_dev(i, "title", /*title*/ ctx[0]);
    			attr_dev(i, "class", "fa fa-moon-o svelte-z2n8iw");
    			add_location(i, file$8, 20, 0, 586);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, link0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, link1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, i, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(body, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(footer, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*toggle*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) {
    				attr_dev(i, "title", /*title*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(body.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(body.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(link0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(link1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t2);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(body, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(footer, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let titleToggl = true;
    	let title;
    	toggle(); // start with dark mode

    	function toggle() {
    		titleToggl = !titleToggl;
    		$$invalidate(0, title = titleToggl ? "Dark mode" : "Light mode");
    		window.document.body.classList.toggle("dark-mode");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Header,
    		Body,
    		Footer,
    		titleToggl,
    		title,
    		toggle
    	});

    	$$self.$inject_state = $$props => {
    		if ("titleToggl" in $$props) titleToggl = $$props.titleToggl;
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, toggle];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
