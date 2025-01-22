class MultiPublicTransportConnectionCard extends AbstractConnectionListCard {
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
                            options: AbstractConnectionListCard.AVAILABLE_THEMES,
                            custom_value: true,
                        }
                    }
                }
            ],
        };
    }

    /**
     * @override
     * @inheritDoc
     */
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
            ...AbstractConnectionListCard.getStubConfig(hass, unusedEntities, allEntities),
            departure_station: getAttribute(entityId, defaultAttributes.departureStation, ''),
            arrival_station: getAttribute(entityId, defaultAttributes.arrivalStation, ''),
            connections_attribute: getAttributeName(entityId, defaultAttributes.connections),
            connection_properties: {
                description: 'products',
                departure_time: 'departure',
                departure_delay: 'delay',
                arrival_time: 'arrival',
                arrival_delay: 'delay_arrival',
            },
            displayed_connections: 3,
        };
    }

    /**
     * @override
     * @inheritDoc
     */
    getConnections(entityId, stateObj) {
        /** @type {Array<ConnectionDetail>} */
        const connections = [];

        const nextConnections = stateObj.attributes[this.config.connections_attribute] || [];

        for (let i = 0; i < this.config.displayed_connections && i < nextConnections.length; i++) {
            const nextConnection = nextConnections[i];

            if (nextConnection === undefined) {
                continue;
            }

            const nextDescription = nextConnection[this.config.connection_properties.description] || '';

            connections.push({
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
            });
        }

        return connections;
    }

    /**
     * @override
     * @inheritDoc
     */
    checkConfig(config) {
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
}

customElements.define("public-transport-connections-card", MultiPublicTransportConnectionCard);
window.customCards = window.customCards || [];
window.customCards.push({
    type: "public-transport-connections-card",
    name: "Public Transport Connections",
    preview: true,
    description: "Display your next connections via public transportation.",
    documentationURL: "https://github.com/silviokennecke/ha-public-transport-connection-card/wiki/Public-Transport-Connection-Card#multiple-connections",
});
