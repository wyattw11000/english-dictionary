const vendorList = {
    cambridge: {
        title: `Cambridge`,
        homepage: `https://dictionary.cambridge.org`,
        search: `https://dictionary.cambridge.org/zht/詞典/英語-漢語-繁體/@___@`,
        voice: `https://dictionary.cambridge.org/zht/media/英語/us_pron/@___@.mp3`,
        embed: true,
    },
    webster: {
        title: `Webster`,
        homepage: `https://www.merriam-webster.com`,
        search: `https://www.merriam-webster.com/dictionary/@___@`,
        embed: true,
    },    
    dict: {
        title: `Dict CN`,
        homepage: `https://dict.cn`,
        search: `https://dict.cn/big5/search?q=@___@`,
        embed: true,
    },
    wordreference: {
        title: `Word Reference`,
        homepage: `https://www.wordreference.com`,
        search: `https://www.wordreference.com/enzh/@___@`,
        voice: `https://www.wordreference.com/audio/en/us/us/@___@.mp3`,
        embed: true,
    },
    thefreedictionary: {
        title: `The Free Dictionary`,
        homepage: `https://www.thefreedictionary.com`,
        search: `https://www.thefreedictionary.com/@___@`,
        voice: `https://img.tfd.com/hm/mp3/@___@.mp3`,
        embed: true,
    },
    youglish: {
        title: `You Gish`,
        homepage: `https://youglish.com`,
        search: `https://youglish.com/pronounce/@___@/english/us`,
        embed: `https://youglish.com/pronounce/@___@/english/us/emb=1&e_id=yg-widget-0&e_comp=8415&e_zones=all,us,uk`,
    },
    voicetube: {
        title: `Voice Tube`,
        homepage: `https://tw.voicetube.com`,
        search: `https://tw.voicetube.com/definition/@___@`,
        embed: true,
    },
    forvo: {
        title: `Forvo`,
        homepage: `https://forvo.com`,
        search: `https://forvo.com/word/@___@/#en_usa`,
        voice: `https://audio12.forvo.com/audios/mp3/@___@.mp3`,
    },
    google: {
        title: `Google`,
        homepage: `https://www.google.com`,
        search: `https://www.google.com/search?q=@___@+definition`,
    },
}

const queryHistory = []
const toastList = {}

let [darkTheme, clipboard] = Array(2).fill(false)
let hasVoice, voiceCounter, slideCounter

const formatUrl = (url, word) => url.replace('@___@', word)

const getLastQuery = () => queryHistory[queryHistory.length - 1]

const getVendorList = () => Object.keys(vendorList)

const getSourceUrl = (vendorName, type, placeholder = '') => {
    const vendor = vendorList[vendorName]

    if (!vendor) return

    switch (type) {
        case 'voice':
            if (typeof vendor['voice'] === 'string') {
                return formatUrl(vendor['voice'], placeholder)
            }
            break

        case 'embed':
            if (typeof vendor['embed'] === 'string') {
                return formatUrl(vendor['embed'], placeholder)
            }

            if (vendor['embed'] === true) {
                return getSourceUrl(vendorName, 'search', placeholder)
            }
            break

        case 'search':
            if (typeof vendor['search'] === 'string') {
                return formatUrl(vendor['search'], placeholder)
            }
            break
    }
}

const getQueryUrl = (copy = false) => {
    const { origin, pathname } = window.location
    const url = `${origin}/${pathname.substring(1)}?${$.param(getLastQuery())}`

    if (copy) {
        navigator.clipboard.writeText(url).then(() => {
            if (toastList.clipboard && toastList.clipboard.instance) {
                $('.toast-body', $(toastList.clipboard.el)).html(
                    `<pre>${JSON.stringify(getLastQuery(), null, 4)}</pre>`,
                )

                toastList.clipboard.instance.show()
            }
        })
    }

    return url
}

const addIndicator = (slideIndex, title, icon) => {
    let iconTemplate = ''

    if (icon) {
        iconTemplate = `<img class="position-absolute top-50 start-50 translate-middle w-50 h-50" src="${icon}">`
    }

    $('#dictionary .carousel-indicators [data-action="search"]').before(
        typeof slideIndex === 'number'
            ? `<button
                class="rounded position-relative"
                type="button"
                title="${title}"
                data-index="${slideIndex}"
                data-action="dictionary"
                data-bs-target="#dictionary"
                data-bs-slide-to="${slideIndex}"
                >
                    ${iconTemplate}
                </button>`
            : `<a
                class="rounded position-relative"
                type="button"
                title="${title}"
                href="${slideIndex}"
                data-action="dictionary"
                data-bs-target
                target="_blank"
                >
                    ${iconTemplate}
                </a>`,
    )
}

const addSlide = (slideIndex, title, content, icon) => {
    addIndicator(slideIndex, title, icon)

    $('#dictionary .carousel-inner').append(
        `<div class="carousel-item h-100">
            ${content}
        </div>`,
    )

    slideCounter++
}

const addVoice = (voiceIndex, title, content, item) => {
    $('#pronunciation tbody').append(
        `<tr data-index="${voiceIndex}">
            <th scope="row">${title}</th>
            <td>${content}</td>
        </tr>`,
    )

    voiceCounter++
}

const initResult = (action) => {
    const buttons = $(
        '#dictionary .carousel-indicators [data-action="dictionary"]',
    )
    const slides = $('#dictionary .carousel-inner .carousel-item')

    switch (action) {
        case 'status':
            hasVoice = false
            voiceCounter = 0
            slideCounter = 0
            break

        case 'remove':
            buttons.detach()
            slides.detach()
            break

        case 'boost':
            buttons.first().addClass('active')
            slides.first().addClass('active')
            break
    }
}

const renderResult = (query) => {
    if (
        !query ||
        !query.data ||
        !Array.isArray(query.data) ||
        query.data.length === 0
    )
        return

    if (queryHistory.length !== 0) {
        if (JSON.stringify(query) === JSON.stringify(getLastQuery())) return

        initResult('remove')
    }

    initResult('status')

    query.data.forEach((item, index) => {
        switch (item.type) {
            case 'voice':
                if (
                    !item.vendor ||
                    !item.id ||
                    !Array.isArray(item.id) ||
                    item.id.length === 0
                )
                    return

                if (index === 0) {
                    hasVoice = true

                    addSlide(
                        slideCounter,
                        `Pronunciation`,
                        `<div class="embed-responsive-item">
                            <div class="table-responsive">
                                <table id="pronunciation" class="table table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th class="col-1" scope="col">Vendor</th>
                                            <th class="col-2" scope="col">Voice</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>`,
                    )
                }

                if (hasVoice) {
                    item.id.forEach((id) => {
                        if (!id) return

                        const voiceUrl = getSourceUrl(item.vendor, 'voice', id)

                        if (voiceUrl) {
                            addVoice(
                                voiceCounter,
                                `<a
                                    href="${formatUrl(
                                        vendorList[item.vendor].search,
                                        item.word,
                                    )}"
                                    target="_blank"
                                    >
                                    ${vendorList[item.vendor].title}
                                </a>`,
                                `<audio class="w-100" controls>
                                    <source src="${voiceUrl}" type="audio/mpeg">
                                </audio>`,
                            )
                        }
                    })
                }
                break

            case 'embed':
                ;(Array.isArray(item.vendor)
                    ? item.vendor
                    : getVendorList()
                ).forEach((name) => {
                    const embedUrl = getSourceUrl(name, 'embed', item.word)

                    if (embedUrl) {
                        addSlide(
                            slideCounter,
                            `${vendorList[name].title}｜${item.word}`,
                            `<iframe class="w-100 h-100" src="${embedUrl}"></iframe>`,
                            `${vendorList[name].homepage}/favicon.ico`,
                        )
                    } else {
                        addIndicator(
                            getSourceUrl(name, 'search', item.word),
                            `${vendorList[name].title}｜${item.word}`,
                            `${vendorList[name].homepage}/favicon.ico`,
                        )
                    }
                })
                break
        }
    })

    if (slideCounter !== 0) {
        initResult('boost')
    }

    queryHistory.push(query)

    if (darkTheme) {
        switchDarkTheme('pronunciation')
    } else {
        switchDarkTheme('dictionary')
    }

    if (clipboard) {
        getQueryUrl(true)
    }

    window.history.pushState('', '', `?${$.param(getLastQuery())}`)

    return true
}

const formInputKeypress = (event) => {
    switch (event.which) {
        case 13:
            formSubmit()
            break
    }
}

const formInputFocus = (index) => {
    const wrapper = $('#searchBox .modal-header').children()

    if (typeof index === 'number') {
        wrapper.eq(index).find('[name="word[]"]').select()
    } else {
        wrapper.last().find('[name="word[]"]').select()
    }
}

const formInputWord = (action, currentInput, val) => {
    switch (action) {
        case 'add':
            currentInput.after(
                `<div class="input-group mt-3">
                    <input class="form-control" name="word[]" type="text">
                    <button class="btn btn-secondary fw-bold" type="button" data-action="removeInput">－</button>
                    <button class="btn btn-info text-light fw-bold" type="button" data-action="addInput">＋</button>
                </div>`,
            )

            const newInput = currentInput.next()

            newInput
                .find('[name="word[]"]')
                .val(val)
                .keypress((event) => formInputKeypress(event))

            newInput
                .find('[data-action="addInput"]')
                .on('click', () => formInputWord('add', newInput))

            newInput
                .find('[data-action="removeInput"]')
                .on('click', () => formInputWord('remove', newInput))

            formInputFocus(newInput.index())

            return newInput

        case 'remove':
            currentInput.detach()
            break
    }
}

const formSubmit = () => {
    const _words = []

    $.deparam($('#searchBox [name="word[]"]').serialize()).word.map((item) => {
        item.trim()
            .split(/\s*[,，、]+\s*/g)
            .map((item) => item && _words.push(item))
    })

    const words = [...new Set(_words)]

    if (words.length === 0) return

    words.sort()

    const data = []
    const vendor = $.deparam(
        $('#searchBox [name="vendor[]"]').serialize(),
    ).vendor

    if (words.length > 1 && vendor.length > 2) return

    words.forEach((word) => {
        const item = {
            type: 'embed',
            word,
        }

        if (vendor && vendor.length !== getVendorList().length) {
            item['vendor'] = vendor
        }

        data.push(item)
    })

    if (renderResult({ data })) {
        $('#searchBox').modal('hide')
    }
}

const switchDarkTheme = (pos = '') => {
    const app = $('#app')
    const dictionaryButtons = $(
        '#dictionary .carousel-indicators [data-action="dictionary"]',
    )
    const pronunciation = $('#pronunciation')
    const voices = $('#pronunciation tbody a')
    const searchBox = $('#searchBox .modal-content')

    switch (pos) {
        case 'dictionary':
            dictionaryButtons.toggleClass('bg-dark')
            break

        case 'pronunciation':
            pronunciation
                .toggleClass('table-dark')
                .toggleClass('table-striped')
                .toggleClass('table-hover')
            voices.toggleClass('link-light')
            break

        default:
            app.toggleClass('bg-dark')
            dictionaryButtons.toggleClass('bg-dark')
            pronunciation
                .toggleClass('table-dark')
                .toggleClass('table-striped')
                .toggleClass('table-hover')
            voices.toggleClass('link-light')
            searchBox.toggleClass('bg-dark').toggleClass('text-light')

            darkTheme = !darkTheme
            break
    }
}

const switchClipboard = () => {
    const button = $(
        '#dictionary .carousel-indicators [data-action="clipboard"]',
    )

    clipboard = !clipboard

    button.toggleClass('bg-danger').toggleClass('bg-success')
}

$(function () {
    getVendorList().forEach((name) => {
        $('#searchBox .modal-body').append(
            `<div class="form-check form-switch p-0">
                <label
                    class="form-check-label w-100 d-flex align-items-center"
                    title="${vendorList[name].title}"
                    >
                    <span class="flex-fill">${vendorList[name].title}</span>
                    <input
                        class="form-check-input bg-info border-0 float-none m-0"
                        type="checkbox"
                        name="vendor[]"
                        value="${name}"
                    >
                </label>
            </div>`,
        )
    })

    $('#searchSubmit').on('click', formSubmit)

    $('#searchBox [name="word[]"]').keypress((event) =>
        formInputKeypress(event),
    )

    $('#searchBox').on('shown.bs.modal', formInputFocus)

    $('#searchBox .modal-header [data-action="addInput"]').on('click', (el) =>
        formInputWord('add', $(el.currentTarget).parent()),
    )

    $('#toastBox .toast[data-toast]').each((index, el) => {
        toastList[$(el).data('toast')] = {
            el,
            instance: new bootstrap.Toast(el),
        }
    })

    if (!renderResult($.deparam(window.location.search.substring(1)))) {
        $('#searchBox').modal('show')
    } else {
        const query = getLastQuery()

        if (query) {
            const data = query.data.filter((item) => item.type === 'embed')

            let vendor,
                targetInput = $('#searchBox .modal-header').children().first()

            data.forEach((item) => {
                targetInput = formInputWord('add', targetInput, item.word)

                if (item.vendor) {
                    vendor = item.vendor
                }
            })

            if (vendor) {
                $('#searchBox [name="vendor[]"]').prop('checked', false)

                vendor.forEach((vendor) =>
                    $(`#searchBox [name="vendor[]"][value="${vendor}"]`).prop(
                        'checked',
                        true,
                    ),
                )
            }
        }
    }

    $('#dictionary .carousel-indicators [data-action="darkTheme"]').on(
        'click',
        switchDarkTheme,
    )

    $('#dictionary .carousel-indicators [data-action="clipboard"]').on(
        'click',
        switchClipboard,
    )

    switchDarkTheme()
})
