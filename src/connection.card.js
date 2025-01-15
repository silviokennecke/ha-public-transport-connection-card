import {
    LitElement,
    html,
    css,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

function timeToStr(time) {
    const parse = Date.parse(time);
    return parse ? (new Date(parse)).toLocaleTimeString([], {'timeStyle': 'short'}) : time;
}

function delayToMinutes(delay) {
    // delay as number
    if (typeof delay === 'number') {
        return delay;
    }

    // delay as HH:MM:SS
    if (typeof delay === 'string' && delay.includes(':')) {
        const delayParts = delay.split(':');
        const hours = parseInt(delayParts[0]) || 0;
        const minutes = parseInt(delayParts[1]) || 0;
        return (hours * 60) + minutes;
    }

    return parseInt(delay) || 0;
}

class PublicTransportConnectionCard extends LitElement {
    static getConfigForm() {
        return {
            schema: [
                {
                    name: "entity",
                    required: true,
                    selector: {entity: {domain: "sensor"}},
                },
                {name: "title", selector: {text: {}}},
                {name: "icon", selector: {icon: {}}},
                {name: "departure_station", selector: {text: {}}},
                {name: "arrival_station", selector: {text: {}}},
                {
                    name: "connections_attribute",
                    required: true,
                    selector: {
                        attribute: {entity_id: ""}
                    },
                    context: {
                        filter_entity: "entity"
                    }
                },
                {
                    name: "connection_properties",
                    type: "grid",
                    schema: [
                        {name: "description", selector: {text: {}}},
                        {name: "departure_time", selector: {text: {}}},
                        {name: "departure_delay", selector: {text: {}}},
                        {name: "arrival_time", selector: {text: {}}},
                        {name: "arrival_delay", selector: {text: {}}},
                    ],
                },
                {name: "displayed_connections", selector: {number: {min: 1}}},
                {
                    name: "theme",
                    selector: {
                        select: {
                            options: ['deutsche-bahn', 'homeassistant'],
                            custom_value: true,
                        }
                    }
                }
            ],
        };
    }

    static getStubConfig(hass, unusedEntities, allEntities) {
        // defaults for deutschebahn and hafas
        const defaultAttributes = {
            connections: ['departures', 'connections'],
            departureStation: ['start', 'origin'],
            arrivalStation: ['goal', 'destination'],
        };

        function getAttributeName(entityId, defaultAttributes) {
            const entity = hass.states[entityId] ?? {attributes: {}};

            for (const attribute of defaultAttributes) {
                if (entity.attributes[attribute] !== undefined) {
                    return attribute;
                }
            }

            return undefined;
        }

        function getAttribute(entityId, defaultAttributes, defaultValue = undefined) {
            const entity = hass.states[entityId] ?? {attributes: {}};
            const attributeName = getAttributeName(entityId, defaultAttributes);

            if (attributeName === undefined) {
                return defaultValue;
            } else {
                return entity.attributes[attributeName];
            }
        }

        function isPublicTransportSensor(entityId) {
            if (entityId.split('.')[0] !== 'sensor') {
                return false;
            }

            return getAttributeName(entityId, defaultAttributes.connections) !== undefined;
        }

        let entityId = unusedEntities.find(isPublicTransportSensor);
        if (!entityId) {
            entityId = allEntities.find(isPublicTransportSensor) || '';
        }

        return {
            title: '', // e.g. Next train
            departure_station: getAttribute(entityId, defaultAttributes.departureStation, ''), // e.g. Home
            arrival_station: getAttribute(entityId, defaultAttributes.arrivalStation, ''), // e.g. Work
            entity: entityId,
            connections_attribute: getAttributeName(entityId, defaultAttributes.connections),
            connection_properties: {
                description: 'products',
                departure_time: 'departure',
                departure_delay: 'delay',
                arrival_time: 'arrival',
                arrival_delay: 'delay_arrival',
            },
            displayed_connections: 3,
            theme: 'deutsche-bahn',
        };
    }

    static get properties() {
        return {
            hass: {},
            config: {},
        };
    }

    render() {
        const title = this.config.title;
        const entity = this.config.entity;
        const theme = this.config.theme;
        const stateObj = this.hass.states[entity];

        if (!stateObj) {
            return html`
                <ha-card class="ptc-theme-${theme}">
                    ${title ? html`<h1>${title}</h1>` : ''}
                    <div class="not-found">Entity ${entity} not found.</div>
                </ha-card>
            `;
        }

        const icon = this.config.icon || stateObj.attributes.icon || 'mdi:train';

        const connections = {
            current: {},
            next: [],
        };

        const useAttributes = !!this.config.attributes;
        const useConnections = !!this.config.connections_attribute;

        if (useAttributes) {
            const description = stateObj.attributes[this.config.attributes.description] || '';

            connections.current = {
                description: Array.isArray(description) ? description.join(', ') : description,
                departure: {
                    time: timeToStr(stateObj.attributes[this.config.attributes.departure_time]),
                    delay: delayToMinutes(stateObj.attributes[this.config.attributes.departure_delay]),
                    station: stateObj.attributes[this.config.attributes.departure_station] || this.config.departure_station || '',
                },
                arrival: {
                    time: timeToStr(stateObj.attributes[this.config.attributes.arrival_time]),
                    delay: delayToMinutes(stateObj.attributes[this.config.attributes.arrival_delay]),
                    station: stateObj.attributes[this.config.attributes.arrival_station] || this.config.arrival_station || '',
                },
            };

            if (this.config.attributes.next_departure_time && this.config.attributes.next_arrival_time) {
                const nextDescription = stateObj.attributes[this.config.attributes.next_description] || '';

                connections.next = [
                    {
                        description: Array.isArray(nextDescription) ? nextDescription.join(', ') : nextDescription,
                        departure: {
                            time: timeToStr(stateObj.attributes[this.config.attributes.next_departure_time]),
                            delay: delayToMinutes(stateObj.attributes[this.config.attributes.next_departure_delay]),
                            station: stateObj.attributes[this.config.attributes.next_departure_station] || this.config.departure_station || '',
                        },
                        arrival: {
                            time: timeToStr(stateObj.attributes[this.config.attributes.next_arrival_time]),
                            delay: delayToMinutes(stateObj.attributes[this.config.attributes.next_arrival_delay]),
                            station: stateObj.attributes[this.config.attributes.next_arrival_station] || this.config.arrival_station || '',
                        },
                    }
                ];
            }
        } else if (useConnections) {
            const nextConnections = stateObj.attributes[this.config.connections_attribute] || [];

            for (let i = 0; i < this.config.displayed_connections && i < nextConnections.length; i++) {
                const nextConnection = nextConnections[i];

                if (nextConnection === undefined) {
                    continue;
                }

                const nextDescription = nextConnection[this.config.connection_properties.description] || '';

                const displayedConnection = {
                    description: Array.isArray(nextDescription) ? nextDescription.join(', ') : nextDescription,
                    departure: {
                        time: timeToStr(nextConnection[this.config.connection_properties.departure_time]),
                        delay: delayToMinutes(nextConnection[this.config.connection_properties.departure_delay]),
                        station: nextConnection[this.config.connection_properties.departure_station] || this.config.departure_station || '',
                    },
                    arrival: {
                        time: timeToStr(nextConnection[this.config.connection_properties.arrival_time]),
                        delay: delayToMinutes(nextConnection[this.config.connection_properties.arrival_delay]),
                        station: nextConnection[this.config.connection_properties.arrival_station] || this.config.arrival_station || '',
                    },
                };

                if (i === 0) {
                    connections.current = displayedConnection;
                } else {
                    connections.next.push(displayedConnection);
                }
            }
        }

        return html`
            <ha-card class="ptc-theme-${theme}">
                ${title ? html`<h1>${title}</h1>` : ''}
                <div class="ptc-main" @click="${(ev) => this._handleAction('tap')}">
                    <div class="ptc-row ptc-stations">
                        <div class="ptc-station-departure">${connections.current.departure.station}</div>
                        <div class="ptc-icon">
                            <ha-icon icon="${icon}">
                        </div>
                        <div class="ptc-station-arrival">${connections.current.arrival.station}</div>
                    </div>
                    <div class="ptc-row ptc-time-bar">
                        <div class="ptc-time-bar-bullet"></div>
                        <div class="ptc-time-bar-line"></div>
                        <div class="ptc-time-bar-bullet"></div>
                    </div>
                    <div class="ptc-row ptc-connection ptc-current-connection">
                        <div class="ptc-time-departure">
                            ${connections.current.departure.time}
                            ${connections.current.departure.delay > 0 ? html`+ ${connections.current.departure.delay}` : ''}
                        </div>
                        <div class="ptc-connection-description">${connections.current.description}</div>
                        <div class="ptc-time-arrival">
                            ${connections.current.arrival.time}
                            ${connections.current.arrival.delay > 0 ? html`+ ${connections.current.arrival.delay}` : ''}
                        </div>
                    </div>
                    ${connections.next.map(connection => html`
                        <div class="ptc-row ptc-connection ptc-next-connection">
                            <div class="ptc-time-departure">
                                ${connection.departure.time}
                                ${connection.departure.delay > 0 ? html`+ ${connection.departure.delay}` : ''}
                            </div>
                            <div class="ptc-connection-description">${connection.description}</div>
                            <div class="ptc-time-arrival">
                                ${connection.arrival.time}
                                ${connection.arrival.delay > 0 ? html`+ ${connection.arrival.delay}` : ''}
                            </div>
                        </div>
                    `)}
                </div>
            </ha-card>
        `;
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error("You need to define an entity");
        }

        const useAttributes = !!config.attributes;
        const useConnectionsList = !!config.connections_attribute;

        if (!useAttributes && !useConnectionsList) {
            throw new Error("You need to define attributes or connections_attribute");
        } else if (useAttributes && useConnectionsList) {
            throw new Error("Yout cann only use attributes or connections_attribute. You cannot use both");
        }

        if (useAttributes) {
            if (!!config.displayed_connections) {
                throw new Error("You cannot define displayed_connections, when using attributes");
            }

            if (!config.attributes.departure_time) {
                throw new Error("You need to define the departure attribute");
            }

            if (!config.attributes.arrival_time) {
                throw new Error("You need to define the arrival attribute");
            }

            if (config.attributes.next_departure_time && !config.attributes.next_arrival_time) {
                throw new Error("If you define the next_departure attribute, you need to also define the next_arrival attribute");
            }
        }

        if (useConnectionsList) {
            if (!config.displayed_connections || config.displayed_connections < 1) {
                throw new Error("displayed_connections must be set to 1 or higher");
            }

            if (!config.connections_attribute) {
                throw new Error("You must define the connections_attribute");
            }

            if (!config.connection_properties.departure_time) {
                throw new Error("You must define the departure_time property for connection entries");
            }

            if (!config.connection_properties.arrival_time) {
                throw new Error("You must define the arrival_time property for connection entries");
            }
        }

        this.config = {
            tap_action: {
                action: 'more-info',
            },
            ...config,
        };
    }

    getCardSize() {
        return 2;
    }

    getLayoutOptions() {
        return {
            grid_rows: 2,
            grid_columns: 4,
            grid_min_rows: 2,
            grid_min_columns: 2,
        };
    }

    _handleAction(action) {
        const event = new Event('hass-action', {
            bubbles: true,
            composed: true,
        });

        event.detail = {
            config: this.config,
            action: action,
        };

        this.dispatchEvent(event);
    }

    static get styles() {
        return css`
            :host {
                --public-transport-connection-card-background-color: #EC0016;
                --public-transport-connection-card-foreground-color: #FFFFFF;
                --public-transport-connection-card-size: 10px;

                --public-transport-connection-card-inner-padding: var(--public-transport-connection-card-size);
                --public-transport-connection-card-time-bar-size: var(--public-transport-connection-card-size);
            }

            ha-card {
                overflow: hidden;
                position: relative;
                height: 100%;
                box-sizing: border-box;

                background-color: var(--public-transport-connection-card-background-color);
                color: var(--public-transport-connection-card-foreground-color);
            }

            /* Card */

            h1 {
                font-family: var(--ha-card-header-font-family, inherit);
                font-size: var(--ha-card-header-font-size, 24px);
                font-weight: 400;
                margin: calc(var(--public-transport-connection-card-inner-padding) * 2) calc(var(--public-transport-connection-card-inner-padding) * 1.5) calc(var(--public-transport-connection-card-inner-padding) / 2);
            }

            .ptc-main {
                display: flex;
                width: 100%;
                flex-direction: column;

                cursor: pointer;
            }

            .ptc-main > :first-child {
                padding-top: var(--public-transport-connection-card-inner-padding);
            }

            .ptc-main > :last-child {
                padding-bottom: var(--public-transport-connection-card-inner-padding);
            }

            .ptc-row {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                padding: 0 calc(var(--public-transport-connection-card-inner-padding) * 1.5);
            }

            /* Stations */

            .ptc-stations {
                padding-bottom: calc(var(--public-transport-connection-card-size) / 2);
            }

            .ptc-stations > * {
                flex: 0 1 auto;
                align-self: flex-end;
                text-align: center;
            }

            .ptc-station-departure,
            .ptc-station-arrival {
                flex: 1;
                text-align: left;
                font-weight: 500;
            }

            .ptc-station-arrival {
                text-align: right;
            }

            /* Time Bar */

            .ptc-time-bar-bullet,
            .ptc-time-bar-line {
                background-color: var(--public-transport-connection-card-foreground-color);
            }

            .ptc-time-bar-bullet {
                width: var(--public-transport-connection-card-time-bar-size);
                height: var(--public-transport-connection-card-time-bar-size);
                border-radius: calc(var(--public-transport-connection-card-time-bar-size) / 2);
            }

            .ptc-time-bar-line {
                flex-grow: 1;
                height: calc(var(--public-transport-connection-card-time-bar-size) / 3);
                margin: calc(var(--public-transport-connection-card-time-bar-size) / 3) calc(-1 * var(--public-transport-connection-card-time-bar-size) / 2);
            }

            /* Connection */

            .ptc-connection.ptc-current-connection {
                padding-top: calc(var(--public-transport-connection-card-size) / 2);
            }

            .ptc-connection.ptc-next-connection {
                font-size: 0.85em;
                opacity: 0.9;
            }

            .ptc-connection .ptc-time-departure,
            .ptc-connection .ptc-time-arrival {
                flex-basis: 25%;
                text-align: left;
            }

            .ptc-connection .ptc-connection-description {
                flex-basis: 50%;
                text-align: center;
            }

            .ptc-connection .ptc-time-arrival {
                text-align: right;
            }

            /* Themes */

            /** Deutsche Bahn **/

            .ptc-theme-deutsche-bahn {
                /* nothing to do, as this is the default */
            }

            /** Homeassistant **/

            .ptc-theme-homeassistant {
                --public-transport-connection-card-background-color: var(--ha-card-background, var(--card-background-color, #fff));
                --public-transport-connection-card-foreground-color: var(--primary-text-color);
            }

            .ptc-theme-homeassistant h1 {
                color: var(--ha-card-header-color, --primary-text-color);
            }
        `;
    }
}

customElements.define("public-transport-connection-card", PublicTransportConnectionCard);
window.customCards = window.customCards || [];
window.customCards.push({
    type: "public-transport-connection-card",
    name: "Public Transport Connection Card",
    preview: true,
    description: "Display your next connections via public transportation.",
    documentationURL: "https://github.com/silviokennecke/ha-public-transport-connection-card/wiki/Components#public-transport-connection",
});
