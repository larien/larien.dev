
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
    			props: { height: /*heigth*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(logo.$$.fragment);
    			attr_dev(div, "class", "logo svelte-asdrcw");
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
    			if (dirty & /*heigth*/ 1) logo_changes.height = /*heigth*/ ctx[0];
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
    	let { heigth } = $$props;
    	const writable_props = ["heigth"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Logo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Logo", $$slots, []);

    	$$self.$set = $$props => {
    		if ("heigth" in $$props) $$invalidate(0, heigth = $$props.heigth);
    	};

    	$$self.$capture_state = () => ({ Logo, heigth });

    	$$self.$inject_state = $$props => {
    		if ("heigth" in $$props) $$invalidate(0, heigth = $$props.heigth);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [heigth];
    }

    class Logo_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { heigth: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Logo_1",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*heigth*/ ctx[0] === undefined && !("heigth" in props)) {
    			console.warn("<Logo> was created without expected prop 'heigth'");
    		}
    	}

    	get heigth() {
    		throw new Error("<Logo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set heigth(value) {
    		throw new Error("<Logo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layout/header/Header.svelte generated by Svelte v3.24.0 */
    const file$1 = "src/layout/header/Header.svelte";

    function create_fragment$2(ctx) {
    	let section;
    	let logo;
    	let t;
    	let current;
    	logo = new Logo_1({ props: { heigth: "70" }, $$inline: true });

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(logo.$$.fragment);
    			t = text("\n\n\t\tMy footer component");
    			attr_dev(section, "id", "header");
    			attr_dev(section, "class", "svelte-mb6sln");
    			add_location(section, file$1, 4, 0, 72);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(logo, section, null);
    			append_dev(section, t);
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

    /* src/layout/body/Body.svelte generated by Svelte v3.24.0 */

    const file$2 = "src/layout/body/Body.svelte";

    function create_fragment$3(ctx) {
    	let section;

    	const block = {
    		c: function create() {
    			section = element("section");
    			section.textContent = "My body component";
    			attr_dev(section, "id", "body");
    			attr_dev(section, "class", "svelte-k39uwo");
    			add_location(section, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
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

    function instance$3($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Body> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Body", $$slots, []);
    	return [];
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
    			attr_dev(p, "class", "svelte-10ftdv3");
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

    // (29:31) 
    function create_if_block_3(ctx) {
    	let a;
    	let i;

    	const block = {
    		c: function create() {
    			a = element("a");
    			i = element("i");
    			attr_dev(i, "class", "fa fa-github");
    			add_location(i, file$5, 33, 12, 944);
    			attr_dev(a, "title", "GitHub page");
    			attr_dev(a, "href", "https://github.com/larien");
    			attr_dev(a, "class", "svelte-4p6h39");
    			add_location(a, file$5, 29, 8, 838);
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(29:31) ",
    		ctx
    	});

    	return block;
    }

    // (22:32) 
    function create_if_block_2(ctx) {
    	let a;
    	let i;

    	const block = {
    		c: function create() {
    			a = element("a");
    			i = element("i");
    			attr_dev(i, "class", "fa fa-twitter");
    			add_location(i, file$5, 26, 12, 755);
    			attr_dev(a, "title", "Twitter page");
    			attr_dev(a, "href", "http://www.twitter.com/larienmf");
    			attr_dev(a, "class", "svelte-4p6h39");
    			add_location(a, file$5, 22, 8, 642);
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(22:32) ",
    		ctx
    	});

    	return block;
    }

    // (15:33) 
    function create_if_block_1(ctx) {
    	let a;
    	let i;

    	const block = {
    		c: function create() {
    			a = element("a");
    			i = element("i");
    			attr_dev(i, "class", "fa fa-linkedin");
    			add_location(i, file$5, 19, 12, 557);
    			attr_dev(a, "title", "LinkedIn page");
    			attr_dev(a, "href", "https://www.linkedin.com/in/lauren-ferreira-9836914b/");
    			attr_dev(a, "class", "svelte-4p6h39");
    			add_location(a, file$5, 15, 8, 421);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(15:33) ",
    		ctx
    	});

    	return block;
    }

    // (8:4) {#if icon == "email"}
    function create_if_block(ctx) {
    	let a;
    	let i;

    	const block = {
    		c: function create() {
    			a = element("a");
    			i = element("i");
    			attr_dev(i, "class", "fa fa-envelope");
    			add_location(i, file$5, 12, 12, 335);
    			attr_dev(a, "title", "E-mail address");
    			attr_dev(a, "href", "mailto:lauren.ferremch@gmail.com");
    			attr_dev(a, "class", "svelte-4p6h39");
    			add_location(a, file$5, 8, 8, 219);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(8:4) {#if icon == \\\"email\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let link;
    	let t;
    	let div;
    	let div_class_value;

    	function select_block_type(ctx, dirty) {
    		if (/*icon*/ ctx[0] == "email") return create_if_block;
    		if (/*icon*/ ctx[0] == "linkedin") return create_if_block_1;
    		if (/*icon*/ ctx[0] == "twitter") return create_if_block_2;
    		if (/*icon*/ ctx[0] == "github") return create_if_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			link = element("link");
    			t = space();
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");
    			add_location(link, file$5, 4, 0, 41);
    			attr_dev(div, "class", div_class_value = "contact " + /*icon*/ ctx[0] + " svelte-4p6h39");
    			add_location(div, file$5, 6, 0, 156);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, link, anchor);
    			insert_dev(target, t, anchor);
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

    			if (dirty & /*icon*/ 1 && div_class_value !== (div_class_value = "contact " + /*icon*/ ctx[0] + " svelte-4p6h39")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(link);
    			if (detaching) detach_dev(t);
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
    			attr_dev(p, "class", "svelte-1skukxc");
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
    			attr_dev(section, "class", "svelte-k5lrzp");
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
    	let main;
    	let body1;
    	let header;
    	let t0;
    	let body0;
    	let t1;
    	let footer;
    	let current;
    	header = new Header({ $$inline: true });
    	body0 = new Body({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			body1 = element("body");
    			create_component(header.$$.fragment);
    			t0 = space();
    			create_component(body0.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(body1, "class", "layout svelte-g972fn");
    			add_location(body1, file$8, 7, 1, 178);
    			attr_dev(main, "class", "svelte-g972fn");
    			add_location(main, file$8, 6, 0, 170);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, body1);
    			mount_component(header, body1, null);
    			append_dev(body1, t0);
    			mount_component(body0, body1, null);
    			append_dev(body1, t1);
    			mount_component(footer, body1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(body0.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(body0.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(body0);
    			destroy_component(footer);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Header, Body, Footer });
    	return [];
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
