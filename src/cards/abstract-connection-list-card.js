/**
 * @typedef {CardConfig&{
 *     icon?: string,
 *     departure_station?: string,
 *     arrival_station?: string
 * }} ConnectionListCardConfig
 *
 * @typedef {{
 *     description: string,
 *     departure: {
 *         time: string,
 *         delay: number,
 *         station: string,
 *     },
 *     arrival: {
 *         time: string,
 *         delay: number,
 *         station: string,
 *     }
 * }} ConnectionDetail
 */

class PublicTransprtAbstractConnectionListCard extends PublicTransprtAbstractCard {
    /**
     * @param {Object} hass
     * @param {Array<string>} unusedEntities
     * @param {Array<string>} allEntities
     * @returns {Object}
     */
    static getStubConfig(hass, unusedEntities, allEntities) {
        return {
            ...super.getStubConfig(hass, unusedEntities, allEntities),
            departure_station: '', // e.g. Home
            arrival_station: '', // e.g. Work
        };
    }

    /**
     * Gets all connections to be displayed
     * @abstract
     * @param {HassStateObject} stateObj
     * @returns {Array<ConnectionDetail>}
     */
    getConnections(stateObj) {
        return [];
    }

    /**
     * @override
     * @inheritDoc
     */
    renderInnerCard(entityState) {
        const stateObj = entityState;

        const icon = this.config.icon || stateObj.attributes.icon || 'mdi:train';

        const connections = this.getConnections(stateObj);
        const currentConnection = connections.shift();

        if (currentConnection === undefined) {
            return html`
                <div class="no-connections" @click="${(ev) => this.handleAction('tap')}">
                    No connections found.
                </div>
            `;
        }

        return html`
            <div class="ptc-main" @click="${(ev) => this.handleAction('tap')}">
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
        `;
    }

    /**
     * @final
     * @param {ConnectionListCardConfig} config
     * @returns {ConnectionListCardConfig}
     * @throws {Error}
     */
    modifyConfig(config) {
        const mergedConfig = {
            tap_action: {
                action: 'more-info',
            },
            ...config,
        };

        return super.modifyConfig(mergedConfig);
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

    static get styles() {
        return css`
            ${super.styles}

            :host {
                --public-transport-connection-card-time-bar-size: var(--public-transport-card-size);
            }

            /* Card */

            .ptc-main {
                display: flex;
                width: 100%;
                flex-direction: column;

                cursor: pointer;
            }

            .ptc-main > :first-child {
                padding-top: var(--public-transport-card-inner-padding);
            }

            .ptc-main > :last-child {
                padding-bottom: var(--public-transport-card-inner-padding);
            }

            .ptc-row {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                padding: 0 calc(var(--public-transport-card-inner-padding) * 1.5);
            }

            /* Stations */

            .ptc-stations {
                padding-bottom: calc(var(--public-transport-card-size) / 2);
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
                background-color: var(--public-transport-card-foreground-color);
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
                padding-top: calc(var(--public-transport-card-size) / 2);
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
        `;
    }
}
