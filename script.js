const click_listeners = new WeakSet()
const click_copy_listeners = new WeakSet()
const ul_listeners = new WeakSet()
/**
 * Adjusts the transition duration based on element height.
 * @param {HTMLElement} element - The element being toggled.
 */
const adjust_transition_duration = (element) => {
    const height = element.scrollHeight;

    // Calculate the duration based on the height (adjust the factor as needed)
    // Example: 0.5ms per pixel of height
    const duration = Math.min(Math.max(height * 0.0001, 0.1), 1); // Between 0.3s and 2s
    const uls = document.querySelectorAll('ul')
    uls.forEach((ul) => ul.style.transitionDuration = `${duration}s`)
};
/**
 * @param {HTMLElement} ul
 * @param {number} adjust_amount
 */
const adjust_outer_height = (ul, adjust_amount) => {
    /**
     * @type {HTMLElement}
     */
    let parent = ul.parentElement
    if (parent.id === "full_tree_view") {
        parent.style.height = `fit-content`
        return
    } else if (parent.tagName === "UL") {
        const current_height = parent.scrollHeight
        parent.style.height = `${current_height + adjust_amount}px`
    }
    adjust_outer_height(parent, adjust_amount)
};
/**
 * @param {MouseEvent} e
 */
const handle_click = (e) => {
    e.stopPropagation()
    /**
     * @type {HTMLElement}
     */
    let target = e.target
    console.log('clicked')
    /**
     * @type {HTMLElement}
     */
    const parent = e?.target?.closest('li')
    if (!target.classList.contains('caret')) {
        target = target.parentElement
    }

    const ul = parent?.querySelector('ul')
    if (ul) {
        adjust_transition_duration(ul)
        if (ul.classList.contains('active')) {
            ul.style.height = `0px`
            ul.classList.remove('active')
            target.classList.add('flipped')
            adjust_outer_height(ul, -ul.scrollHeight)
        } else {
            ul.style.height = `${ul.scrollHeight}px`
            ul.classList.add('active')
            target.classList.remove('flipped')
            adjust_outer_height(ul, ul.scrollHeight)
        }
    }
}
/**
 * @param {MouseEvent} e
 */
const mouse_enter = (e) => {
    e.stopPropagation()
    /**
     * @type {HTMLElement}
     */
    const target = e.target
    /**
     * @type {HTMLElement}
     */
    let ul = target.closest('ul')
    if (target.tagName === 'LI') {
        ul = target.querySelector('ul') || ul
    }
    if (target.classList.contains('header') || target.classList.contains('brackets')) {
        ul = target.parentElement.parentElement.querySelector('ul') || ul
    }
    if (target.classList.contains('caret') || target.classList.contains('copy_button')) {
        ul = target.parentElement.querySelector('ul') || ul
    }
    ul?.classList.add('ul_hover')
}
/**
 * @param {MouseEvent} e
 */
const mouse_leave = (e) => {
    e.stopPropagation()
    /**
     * @type {HTMLElement}
     */
    const target = e.target
    /**
     * @type {HTMLElement}
     */
    let ul = target.closest('ul')
    if (target.tagName === 'LI') {
        ul = target.querySelector('ul') || ul
    }
    if (target.classList.contains('header') || target.classList.contains('brackets')) {
        ul = target.parentElement.parentElement.querySelector('ul') || ul
    }
    if (target.classList.contains('caret') || target.classList.contains('copy_button')) {
        ul = target.parentElement.querySelector('ul') || ul
    }
    ul?.classList.remove('ul_hover')
}

/**
 * @param {MouseEvent} e
 */
const handle_copy_click = (e) => {
    const target = e.target
    target.innerHTML = "Copied."
    setTimeout(() => {
        /**
         * @type {HTMLElement}
         */
        target.innerHTML = "Copy to clipboard"
    }, 2000)
}
let current = undefined
/**
 * @param {MouseEvent} e
 */
const li_mouse_enter = (e) => {
    /**
     * @type {HTMLElement}
     */
    const target = e.target
    const button = target.querySelector('button')
    if (!button) return
    if (current && current !== button) {
        current.style.opacity = "0"
        current.style.pointerEvents = "none"
        button.style.opacity = "1"
        button.style.pointerEvents = "all"
        current = button
    } else {
        button.style.opacity = "1"
        button.style.pointerEvents = "all"
        current = button
    }
}

/**
 * @type {MutationObserver}
 */
const observer = new MutationObserver((m) => {
    /**
     * @type {HTMLElement}
     */
    const target = m[0].target
    if (target.tagName === "BUTTON") return
    if (target.tagName === "SPAN") return
    if (target.tagName === "LI") return
    const carets = document.querySelectorAll('span.caret')
    const uls = document.querySelectorAll('ul.nested')
    const lis = document.querySelectorAll('li')
    console.log('Observing View')

    for (let i = 0; i < lis.length; i++) {
        const parent = lis[i]
        if (parent.firstElementChild.classList.contains('caret')) {
            continue
        }
        const text = parent.firstChild.textContent
        const [lhs, rhs] = text.split(']')
        new_el = document.createElement('span')
        new_el.innerHTML = `<span class='brackets'>[</span><span class='header'>${lhs.substring(1)}</span><span class='brackets'>]</span> ${rhs}`
        lis[i].firstChild.replaceWith(new_el)
    }

    for (let i = 0; i < carets.length; i++) {
        const html = carets[i].innerHTML
        const [lhs, rhs] = html.split(']')
        carets[i].innerHTML = `<span class='brackets dropdown-brackets'>[</span><span class='header dropdown-header'>${lhs.substring(1)}</span><span class='brackets dropdown-brackets'>]</span> ${rhs}`
    }
    for (let i = 0; i < uls.length; i++) {
        /**
         * @type {HTMLUListElement}
         */
        const ul = uls[i]
        ul.style.height = `${ul.scrollHeight}px`
    }
})

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Loaded')
    const root = document.querySelector('body')
    console.log(root)
    observer.observe(root, { childList: true, subtree: true, attributes: false })

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('caret') || e.target.classList.contains('brackets') || e.target.classList.contains('header')) {
            handle_click(e)
        } else if (e.target.classList.contains('copy_button')) {
            handle_copy_click(e)
        }
    })
    document.addEventListener('mouseover', (e) => {
        switch (e.target.tagName) {
            case "UL":
                if (e.target.classList.contains('nested')) {
                    mouse_enter(e)
                }
                return
            case "SPAN":
            case "BUTTON":
                mouse_enter(e)
            case "LI":
                mouse_enter(e)
                li_mouse_enter(e)
                return
        }
    })
    document.addEventListener('mouseout', (e) => {
        switch (e.target.tagName) {
            case "UL":
                if (e.target.classList.contains('nested')) {
                    mouse_leave(e)
                }
                return
            case "LI":
            case "SPAN":
            case "BUTTON":
                mouse_leave(e)
        }
    })
})
