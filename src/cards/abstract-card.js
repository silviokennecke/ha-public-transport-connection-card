/**
 * @typedef {{
 *     entity_id: string,
 *     state: string,
 *     attributes: Object,
 *     last_changed: string,
 *     last_updated: string,
 *     context: {
 *         id: string,
 *         user_id: string,
 *     },
 * }} HassStateObject
 *
 * @typedef {{
 *     states: {
 *         [entityId: string]: HassStateObject,
 *     },
 * }} HassObject
 *
 * @typedef {{
 *     entityTypes?: string[],
 *     entityAttributes?: string[],
 *     isEntitySupported?: (entity: HassStateObject) => boolean,
 *     getConfig: (entity: HassStateObject) => Object,
 * }} DefaultDiscoverableConfig
 *
 * @typedef {DefaultDiscoverableConfig[]|{[key: string]: DefaultDiscoverableConfig}} DefaultDiscoverableConfigs
 *
 * @typedef {{
 *     title: string,
 *     entity: string,
 *     theme: string,
 * }} CardConfig
 */

/**
 * @class
 * @property {HassObject} hass
 * @property {Object} config
 */
class PublicTransprtAbstractCard extends LitElement {
    static AVAILABLE_THEMES = [
        'deutsche-bahn',
        'homeassistant',
    ];

    /**
     * @abstract
     * @returns {{schema: Object[]}}
     */
    static getConfigForm() {
        return {
            schema: [
                {
                    name: "entity",
                    required: true,
                    selector: {entity: {domain: "sensor"}},
                },
                {name: "title", selector: {text: {}}},
                {
                    name: "theme",
                    selector: {
                        select: {
                            options: this.AVAILABLE_THEMES,
                            custom_value: true,
                        }
                    }
                }
            ],
        };
    }

    /**
     * @param {DefaultDiscoverableConfigs} defaultConfigs
     * @param {string[]} entityIds
     * @param {HassObject} hass
     * @returns {Object|undefined}
     */
    static detectDefaultConfig(defaultConfigs, entityIds, hass) {
        const configs = Array.isArray(defaultConfigs) ? defaultConfigs : Object.values(defaultConfigs);

        for (const defaultConfig of configs) {
            const entityId = entityIds.find(
                (entityId) => {
                    /** @type {HassStateObject} */
                    const entity = hass.states[entityId];
                    let entityChecked = false;

                    // check by entity type
                    if (defaultConfig.entityTypes) {
                        const entityType = entityId.split('.')[0];
                        if (!defaultConfig.entityTypes.includes(entityType)) {
                            return false;
                        }

                        entityChecked = true;
                    }

                    // check by required attributes
                    if (defaultConfig.entityAttributes) {
                        let attributesExist = true;

                        for (const attribute of defaultConfig.entityAttributes) {
                            if (entity.attributes[attribute] === undefined) {
                                attributesExist = false;
                                break;
                            }
                        }

                        if (!attributesExist) {
                            return false;
                        }

                        entityChecked = true;
                    }

                    // check by custom function
                    if (defaultConfig.isEntitySupported) {
                        return defaultConfig.isEntitySupported(entity);
                    }

                    // validation success
                    if (entityChecked) {
                        return true;
                    }

                    throw new Error('Implementation error: The default configuration object must at least provide one method for entity detection.');
                }
            );

            if (entityId) {
                return defaultConfig.getConfig(hass.states[entityId]);
            }
        }

        return undefined;
    }

    /**
     * @param {HassObject} hass
     * @param {string[]} unusedEntities
     * @param {string[]} allEntities
     * @returns {Object}
     */
    static getStubConfig(hass, unusedEntities, allEntities) {
        return {
            title: '',
            entity: '',
            theme: 'deutsche-bahn',
        };
    }

    static get properties() {
        return {
            hass: {},
            config: {},
        };
    }

    static get styles() {
        return css`
            :host {
                --public-transport-card-background-color: #EC0016;
                --public-transport-card-foreground-color: #FFFFFF;
                --public-transport-card-size: 10px;

                --public-transport-card-inner-padding: var(--public-transport-card-size);
            }

            ha-card {
                overflow: hidden;
                position: relative;
                height: 100%;
                box-sizing: border-box;

                background-color: var(--public-transport-card-background-color);
                color: var(--public-transport-card-foreground-color);
            }

            /* Card */

            h1 {
                font-family: var(--ha-card-header-font-family, inherit);
                font-size: var(--ha-card-header-font-size, 24px);
                font-weight: 400;
                margin: calc(var(--public-transport-card-inner-padding) * 2) calc(var(--public-transport-card-inner-padding) * 1.5) calc(var(--public-transport-card-inner-padding) / 2);
            }

            /* Themes */

            /** Deutsche Bahn **/

            .ptc-theme-deutsche-bahn {
                /* nothing to do, as this is the default */
            }

            /** Homeassistant **/

            .ptc-theme-homeassistant {
                --public-transport-card-background-color: var(--ha-card-background, var(--card-background-color, #fff));
                --public-transport-card-foreground-color: var(--primary-text-color);
            }

            .ptc-theme-homeassistant h1 {
                color: var(--ha-card-header-color, --primary-text-color);
            }
        `;
    }

    /**
     * Allows children to modify the configuration before it is validated or stored
     * @protected
     * @param {CardConfig} config
     * @returns {CardConfig}
     */
    modifyConfig(config) {
        return {
            title: '',
            entity: '',
            theme: 'deutsche-bahn',
            ...config,
        };
    }

    /**
     * Validates the configuration
     * @protected
     * @param {CardConfig} config
     * @returns {void}
     * @throws {Error}
     */
    checkConfig(config) {
        if (!config.entity) {
            throw new Error("You need to define an entity");
        }
    }

    /**
     * @public
     * @final
     * @param {CardConfig} config
     * @returns {void}
     * @throws {Error}
     */
    setConfig(config) {
        config = this.modifyConfig(config);
        this.checkConfig(config);

        this.config = config;
    }

    /**
     * @public
     * @returns {string}
     */
    render() {
        const title = this.config.title || '';
        const entityId = this.config.entity || '';
        const theme = this.config.theme || this.constructor.AVAILABLE_THEMES[0];
        const stateObj = this.hass.states[entityId];

        if (!stateObj) {
            return html`
                <ha-card class="ptc-theme-${theme}">
                    ${title ? html`<h1>${title}</h1>` : ''}
                    <div class="not-found">Entity ${entityId} not found.</div>
                </ha-card>
            `;
        }

        return html`
            <ha-card class="ptc-theme-${this.config.theme}">
                ${title ? html`<h1>${title}</h1>` : ''}
                ${this.renderInnerCard(stateObj)}
            </ha-card>
        `;
    }

    /**
     * @abstract
     * @protected
     * @param {HassStateObject} entityState
     * @returns {string}
     */
    renderInnerCard(entityState) {
        return html`
            Not implemented. The card must implement the renderInnerCard method.
        `;
    }

    /**
     * Helper to handle actions on cards (e.g. tap)
     * @protected
     * @param {string} action
     */
    handleAction(action) {
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
}
