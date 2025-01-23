import {
    LitElement,
    html,
    css,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

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
 */

/**
 * @typedef {{
 *     states: {
 *         [entityId: string]: HassStateObject,
 *     },
 * }} HassObject
 */

/**
 * @typedef {{
 *     entityTypes?: string[],
 *     entityAttributes?: string[],
 *     isEntitySupported?: (entity: HassStateObject) => boolean,
 *     getConfig: (entity: HassStateObject) => Object,
 * }} DefaultDiscoverableConfig
 */

/**
 * @typedef {DefaultDiscoverableConfig[]|{[key: string]: DefaultDiscoverableConfig}} DefaultDiscoverableConfigs
 */

class AbstractCard extends LitElement {
    static AVAILABLE_THEMES = [
        'deutsche-bahn',
        'homeassistant',
    ];

    /**
     * @param {DefaultDiscoverableConfigs} defaultConfigs
     * @param {string[]} entityIds
     * @param {HassObject} hass
     * @returns {Object|undefined}
     */
    static detectDefaultConfig(defaultConfigs, entityIds, hass) {
        for (const defaultConfig of defaultConfigs) {
            const entityId = entityIds.find(
                (entityId) => {
                    /** @type {HassStateObject} */
                    const entity = hass.states[entityId];

                    // check by entity type
                    if (defaultConfig.entityTypes) {
                        const entityType = entityId.split('.')[0];
                        if (!defaultConfig.entityTypes.includes(entityType)) {
                            return false;
                        }
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
                    }

                    // check by custom function
                    if (defaultConfig.isEntitySupported) {
                        return defaultConfig.isEntitySupported(entity);
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
                --public-transport-connection-card-background-color: var(--ha-card-background, var(--card-background-color, #fff));
                --public-transport-connection-card-foreground-color: var(--primary-text-color);
            }

            .ptc-theme-homeassistant h1 {
                color: var(--ha-card-header-color, --primary-text-color);
            }
        `;
    }
}
