/**
 * @typedef {CardConfig&{
 *    layout: string,
 *    departures_attribute: string,
 *    departure_properties: {
 *        time: string,
 *        delay?: string,
 *        cancelled?: string,
 *        train?: string,
 *        direction: string,
 *        platform?: string,
 *        next_stations?: string,
 *    },
 *    destination_filter?: string,
 *    displayed_departures: number,
 * }} DepartureCardConfig
 */

/**
 * @typedef {{
 *     time: string,
 *     delay: number,
 *     isCancelled: boolean,
 *     train: string,
 *     direction: string|undefined,
 *     platform: string|undefined,
 *     nextStations: string[],
 * }} Departure
 */

/**
 * @typedef {'station_departures'|'platform_departures'|'fixed_destination'} DepartureCardLayouts
 * @typedef {'time'|'offset'|'train'|'direction'|'next_stations'|'platform'|'spacer'} DepartureCardColumnTypes
 */

class PublicTransportDepartureCard extends AbstractCard {
    /**
     * @type {DepartureCardColumnTypes[][]}
     */
    static FIRST_DEPARTURE_LAYOUT = [
        ['time', 'train'],
        ['direction', 'next_stations'],
        [],
        ['platform'],
    ];

    /**
     * @type {{[key: DepartureCardLayouts]: {
     *     firstDepartureLayout?: DepartureCardColumnTypes[][],
     *     columns: DepartureCardColumnTypes[],
     *     cardSize?: number,
     *     layoutOptions?: {
     *         grid_rows: number,
     *         grid_columns: number,
     *         grid_min_rows?: number,
     *         grid_min_columns?: number,
     *     }
     * }}}
     */
    static LAYOUT_PRESETS = {
        station_departures: {
            firstDepartureLayout: this.FIRST_DEPARTURE_LAYOUT,
            columns: ['time', 'train', 'next_stations', 'direction', 'platform'],
            layoutOptions: {
                grid_rows: 3,
                grid_columns: 4,
                grid_min_rows: 2,
                grid_min_columns: 3,
            },
        },
        platform_departures: {
            firstDepartureLayout: [['train'], ['direction'], [], ['offset']],
            columns: ['train', 'direction', 'offset'],
            layoutOptions: {
                grid_rows: 2,
                grid_columns: 4,
                grid_min_rows: 2,
                grid_min_columns: 2,
            },
        },
        fixed_destination: {
            firstDepartureLayout: this.FIRST_DEPARTURE_LAYOUT,
            columns: ['time', 'train', 'next_stations', 'platform'],
            layoutOptions: {
                grid_rows: 3,
                grid_columns: 4,
                grid_min_rows: 2,
                grid_min_columns: 2,
            }
        },
    };

    static getConfigForm() {
        return {
            schema: [
                ...super.getConfigForm().schema,

                {
                    name: "layout",
                    required: true,
                    selector: {
                        select: {
                            options: Object.keys(this.LAYOUT_PRESETS),
                            custom_value: false,
                        }
                    }
                },
                {
                    name: "departures_attribute",
                    required: true,
                    selector: {
                        attribute: {entity_id: ""}
                    },
                    context: {
                        filter_entity: "entity"
                    }
                },
                {
                    name: "departure_properties",
                    type: "grid",
                    schema: [
                        {name: "time", required: true, selector: {text: {}}},
                        {name: "delay", selector: {text: {}}},
                        {name: "cancelled", selector: {text: {}}},
                        {name: "train", selector: {text: {}}},
                        {name: "direction", required: true, selector: {text: {}}},
                        {name: "platform", selector: {text: {}}},
                        {name: "next_stations", selector: {text: {}}},
                    ],
                },
                {name: "destination_filter", selector: {text: {}}},
                {name: "displayed_departures", selector: {number: {min: 1}}},
            ],
        };
    }

    /**
     * @param {HassObject} hass
     * @param {string[]} unusedEntities
     * @param {string[]} allEntities
     * @returns {DepartureCardConfig}
     */
    static getStubConfig(hass, unusedEntities, allEntities) {
        /** @type {DefaultDiscoverableConfigs} */
        const defaultConfigs = {
            db_infoscreen: {
                entityTypes: ['sensor'],
                entityAttributes: ['next_departures'],
                getConfig: (entity) => ({
                    entity: entity.entity_id,
                    station: entity.attributes.station,
                    departures_attribute: 'next_departures',
                    departure_properties: {
                        time: 'scheduledDeparture',
                        delay: 'delayDeparture',
                        cancelled: 'isCancelled',
                        train: 'train',
                        direction: 'destination',
                        platform: 'platform',
                        next_stations: 'via',
                    },
                }),
            },
        };

        /** @type {Partial<DepartureCardConfig>} */
        const defaultConfig = super.detectDefaultConfig(
            defaultConfigs,
            [...unusedEntities, ...allEntities],
            hass
        ) || {};

        return {
            ...super.getStubConfig(hass, unusedEntities, allEntities),

            layout: Object.keys(this.LAYOUT_PRESETS)[0],
            departures_attribute: '',
            departure_properties: {
                time: '',
                delay: '',
                cancelled: '',
                train: '',
                direction: '',
                platform: '',
                next_stations: '',
            },
            destination_filter: '',
            displayed_departures: 5,

            ...defaultConfig,
        };
    }

    static get styles() {
        return css`
            ${AbstractCard.styles}

            .ptd-main {
                display: flex;
                width: 100%;
                flex-direction: column;

                cursor: pointer;
            }

            .ptcd-main > :first-child {
                padding-top: var(--public-transport-card-inner-padding);
            }

            .ptcd-main > :last-child {
                padding-bottom: var(--public-transport-card-inner-padding);
            }

            .ptcd-row {
                display: flex;
                flex-direction: row;
                gap: var(--public-transport-card-inner-padding);
                padding: 0 calc(var(--public-transport-card-inner-padding) * 1.5);
            }

            .ptcd-is-cancelled {
                text-decoration: line-through;
            }

            .ptcd-spacer {
                flex: 1;
            }

            .ptcd-time-departure,
            .ptcd-time-departure-offset,
            .ptcd-train,
            .ptcd-platform {
                white-space: nowrap;
            }

            .ptcd-first-departure {
                justify-content: flex-start;
                gap: calc(2 * var(--public-transport-card-inner-padding));

                margin-top: var(--public-transport-card-inner-padding);
                border-top: 1px solid var(--public-transport-card-foreground-color);
                padding-top: calc(0.5 * var(--public-transport-card-inner-padding)) !important;

                padding-bottom: calc(0.5 * var(--public-transport-card-inner-padding));
                border-bottom: 1px solid var(--public-transport-card-foreground-color);
                margin-bottom: calc(0.5 * var(--public-transport-card-inner-padding));
            }

            .ptcd-first-departure > .ptcd-first-departure-section > :first-child {
                font-size: 1.3em;
            }
            .ptcd-first-departure > .ptcd-first-departure-section > .ptcd-platform:first-child:last-child {
                display: flex;
                height: 100%;
                align-items: center;
                font-size: 2em;
            }

            .ptcd-next-departure {
                font-size: 0.85em;
                opacity: 0.9;
            }

            .ptcd-next-departure .ptcd-time-departure,
            .ptcd-next-departure .ptcd-time-departure-offset,
            .ptcd-next-departure .ptcd-train,
            .ptcd-next-departure .ptcd-platform {
                flex: 1;
            }

            .ptcd-next-departure .ptcd-direction {
                flex: 2;
                white-space: nowrap;
            }

            .ptcd-next-departure .ptcd-next-stations {
                flex: 3;
                flex-shrink: 2;

                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .ptcd-next-departure .ptcd-time-departure-offset:last-child,
            .ptcd-next-departure .ptcd-platform:last-child {
                text-align: right;
            }
        `;
    }

    render() {
        const title = this.config.title;
        const entityId = this.config.entity;
        const theme = this.config.theme;
        const stateObj = this.hass.states[entityId];

        if (!stateObj) {
            return html`
                <ha-card class="ptd-theme-${theme}">
                    ${title ? html`<h1>${title}</h1>` : ''}
                    <div class="not-found">Entity ${entityId} not found.</div>
                </ha-card>
            `;
        }

        const departures = this._getDepartures();
        const layoutConfig = this.constructor.LAYOUT_PRESETS[this.config.layout];

        const nextDepartures = [...departures];
        const firstDeparture = layoutConfig.firstDepartureLayout ? nextDepartures.shift() : undefined;

        return html`
            <ha-card class="ptc-theme-${theme} ptcd-layout-${this.config.layout}">
                ${title ? html`<h1>${title}</h1>` : ''}
                <div class="ptcd-main" @click="${(ev) => this.handleAction('tap')}">
                    ${layoutConfig.firstDepartureLayout && firstDeparture ? html`
                        <div class="ptcd-row ptcd-first-departure ${firstDeparture.isCancelled ? 'ptcd-is-cancelled' : ''}">
                            ${layoutConfig.firstDepartureLayout.map(row => html`
                                <div class="ptcd-first-departure-section ${row.length === 0 ? 'ptcd-spacer' : ''}">
                                    ${row.map(column => this._renderColumn(firstDeparture, column))}
                                </div>
                            `)}
                        </div>
                    ` : ''}
                    ${nextDepartures.map(departure => html`
                        <div class="ptcd-row ptcd-next-departure ${departure.isCancelled ? 'ptcd-is-cancelled' : ''}">
                            ${layoutConfig.columns.map(column => this._renderColumn(departure, column))}
                        </div>
                    `)}
                </div>
            </ha-card>
        `;
    }

    /**
     * @override
     * @param {DepartureCardConfig} config
     * @returns {DepartureCardConfig}
     */
    modifyConfig(config) {
        const mergedConfig = {
            tap_action: {
                action: 'more-info',
            },
            ...config,
        };

        if (!mergedConfig.layout || mergedConfig.layout === '') {
            mergedConfig.layout = Object.keys(this.constructor.LAYOUT_PRESETS)[0];
        }

        return super.modifyConfig(mergedConfig);
    }

    /**
     * @override
     * @param {DepartureCardConfig} config
     * @returns {void}
     */
    checkConfig(config) {
        if (!Object.keys(this.constructor.LAYOUT_PRESETS).includes(config.layout)) {
            throw new Error("You must define a valid layout. Available layouts: " + Object.keys(this.constructor.LAYOUT_PRESETS).join(', '));
        }

        if (!config.departures_attribute || config.departures_attribute === '') {
            throw new Error("You must define which attribute of the sensor holds the departures as array.");
        }

        if (!config.departure_properties) {
            throw new Error("You must define the departure_properties.");
        }

        if (!config.departure_properties.time) {
            throw new Error("You must define the time property for the departure entries.");
        }

        if (!config.departure_properties.direction) {
            throw new Error("You must define the direction property for the departure entries.");
        }

        if (!config.displayed_departures || config.displayed_departures < 1) {
            throw new Error("displayed_connections must be set to 1 or higher");
        }
    }

    getCardSize() {
        return this.constructor.LAYOUT_PRESETS[this.config.layout || ''].cardSize || 2;
    }

    getLayoutOptions() {
        return this.constructor.LAYOUT_PRESETS[this.config.layout || ''].layoutOptions || {
            grid_rows: 2,
            grid_columns: 4,
            grid_min_rows: 2,
            grid_min_columns: 2,
        };
    }

    /**
     * @returns {Departure[]}
     * @private
     */
    _getDepartures() {
        const stateObj = this.hass.states[this.config.entity];
        const stateDepartures = stateObj.attributes[this.config.departures_attribute] || [];
        /** @type {Departure[]} */
        const departures = [];

        for (let i=0; i < stateDepartures.length && departures.length < this.config.displayed_departures; i++) {
            const stateDeparture = stateDepartures[i];

            /** @type {Departure} */
            const departure = {
                time: timeToStr(stateDeparture[this.config.departure_properties.time] || ''),
                delay: 0,
                isCancelled: false,
                train: '',
                direction: stateDeparture[this.config.departure_properties.direction] || '',
                platform: '',
                nextStations: [],
            };

            if (this.config.departure_properties.delay) {
                departure.delay = delayToMinutes(stateDeparture[this.config.departure_properties.delay] || 0);
            }

            if (this.config.departure_properties.cancelled) {
                departure.isCancelled = parseBool(stateDeparture[this.config.departure_properties.cancelled] || false);
            }

            if (this.config.departure_properties.train) {
                departure.train = stateDeparture[this.config.departure_properties.train] || '';
            }

            if (this.config.departure_properties.platform) {
                departure.platform = stateDeparture[this.config.departure_properties.platform] || '';
            }

            if (this.config.departure_properties.next_stations) {
                departure.nextStations = stateDeparture[this.config.departure_properties.next_stations] || [];
            }

            if (this.config.destination_filter) {
                const filter = this.config.destination_filter.toUpperCase();

                if (
                    !departure.direction.toUpperCase().includes(filter)
                    && !departure.nextStations.join('; ').toUpperCase().includes(filter)
                ) {
                    continue;
                }
            }

            departures.push(departure);
        }

        return departures;
    }

    /**
     * @param {Departure} departure
     * @param {DepartureCardColumnTypes} columnType
     * @returns {string}
     * @private
     */
    _renderColumn(departure, columnType) {
        switch (columnType) {
            case 'time':
                return html`
                    <div class="ptcd-time-departure">
                        ${departure.time}
                        ${departure.delay > 0 ? html`+ ${departure.delay}` : ''}
                    </div>
                `;

            case 'offset':
                const offset = timeOffset(departure.time, departure.delay);
                return html`
                    <div class="ptcd-time-departure-offset">${offset}</div>
                `;

            case 'train':
                return html`
                    <div class="ptcd-train">${departure.train}</div>
                `;

            case 'direction':
                return html`
                    <div class="ptcd-direction">${departure.direction}</div>
                `;

            case 'next_stations':
                return html`
                    <div class="ptcd-next-stations">${departure.nextStations.join(', ')}</div>
                `;

            case 'platform':
                return html`
                    <div class="ptcd-platform">
                        ${departure.platform}
                    </div>
                `;

            case 'spacer':
                return html`
                    <div class="ptcd-spacer"></div>
                `;

            default:
                return '';
        }
    }
}

customElements.define("public-transport-departures-card", PublicTransportDepartureCard);
window.customCards = window.customCards || [];
window.customCards.push({
    type: "public-transport-departures-card",
    name: "Public Transport Departures",
    preview: true,
    description: "Display your next departures from a station.",
    documentationURL: "https://github.com/silviokennecke/ha-public-transport-connection-card/wiki/Public-Transport-Departures-Card",
});
