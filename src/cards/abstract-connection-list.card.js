import {
    LitElement,
    html,
    css,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

/**
 * @typedef {{title: string, entity: string, theme: string, icon?: string, departure_station?: string, arrival_station?: string}} ConnectionListCardConfig
 * @typedef {{description: string, departure: { time: string, delay: number, station: string }, arrival: { time: string, delay: number, station: string }}} ConnectionDetail
 */

class AbstractConnectionListCard extends LitElement {
    static AVAILABLE_THEMES = [
        'deutsche-bahn',
        'homeassistant',
    ];

    /**
     * @param {Object} hass
     * @param {Array<string>} unusedEntities
     * @param {Array<string>} allEntities
     * @returns {Object}
     */
    static getStubConfig(hass, unusedEntities, allEntities) {
        return {
            title: '', // e.g. Next train
            departure_station: '', // e.g. Home
            arrival_station: '', // e.g. Work
            entity: entityId,
            theme: 'deutsche-bahn',
        };
    }

    static get properties() {
        return {
            hass: {},
            config: {},
        };
    }

    /**
     * Gets all connections to be displayed
     * @abstract
     * @param {string} entityId
     * @param {Object} stateObj
     * @returns {Array<ConnectionDetail>}
     */
    getConnections(entityId, stateObj) {
        return [];
    }

    render() {
        const title = this.config.title;
        const entityId = this.config.entity;
        const theme = this.config.theme;
        const stateObj = this.hass.states[entityId];

        if (!stateObj) {
            return html`
                <ha-card class="ptc-theme-${theme}">
                    ${title ? html`<h1>${title}</h1>` : ''}
                    <div class="not-found">Entity ${entityId} not found.</div>
                </ha-card>
            `;
        }

        const icon = this.config.icon || stateObj.attributes.icon || 'mdi:train';

        const connections = this.getConnections(entityId, stateObj);
        const currentConnection = connections.shift();

        if (currentConnection === undefined) {
            return html`
                <ha-card class="ptc-theme-${theme}">
                    ${title ? html`<h1>${title}</h1>` : ''}
                    <div class="no-connections" @click="${(ev) => this._handleAction('tap')}">
                        No connections found.
                    </div>
                </ha-card>
            `;
        }

        return html`
            <ha-card class="ptc-theme-${theme}">
                ${title ? html`<h1>${title}</h1>` : ''}
                <div class="ptc-main" @click="${(ev) => this._handleAction('tap')}">
                    <div class="ptc-row ptc-stations">
                        <div class="ptc-station-departure">${currentConnection.departure.station}</div>
                        <div class="ptc-icon">
                            <ha-icon icon="${icon}">
                        </div>
                        <div class="ptc-station-arrival">${currentConnection.arrival.station}</div>
                    </div>
                    <div class="ptc-row ptc-time-bar">
                        <div class="ptc-time-bar-bullet"></div>
                        <div class="ptc-time-bar-line"></div>
                        <div class="ptc-time-bar-bullet"></div>
                    </div>
                    <div class="ptc-row ptc-connection ptc-current-connection">
                        <div class="ptc-time-departure">
                            ${currentConnection.departure.time}
                            ${currentConnection.departure.delay > 0 ? html`+ ${currentConnection.departure.delay}` : ''}
                        </div>
                        <div class="ptc-connection-description">${currentConnection.description}</div>
                        <div class="ptc-time-arrival">
                            ${currentConnection.arrival.time}
                            ${currentConnection.arrival.delay > 0 ? html`+ ${currentConnection.arrival.delay}` : ''}
                        </div>
                    </div>
                    ${connections.map(connection => html`
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

    /**
     * @param {ConnectionListCardConfig} config
     * @returns {void}
     * @throws {Error}
     */
    checkConfig(config) {
        if (!config.entity) {
            throw new Error("You need to define an entity");
        }
    }

    /**
     * @final
     * @param {ConnectionListCardConfig} config
     * @returns {void}
     * @throws {Error}
     */
    setConfig(config) {
        this.checkConfig(config);

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
