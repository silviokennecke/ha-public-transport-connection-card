class MultiPublicTransportConnectionCard extends PublicTransprtAbstractConnectionListCard {
    static getConfigForm() {
        return {
            schema: [
                ...super.getConfigForm().schema,

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
            ],
        };
    }

    /**
     * @override
     * @inheritDoc
     */
    static getStubConfig(hass, unusedEntities, allEntities) {
        // defaults for deutschebahn and hafas
        const defaultConfigs = {
            ha_deutschebahn: {
                entityTypes: ['sensor'],
                entityAttributes: ['departures'],
                getConfig: (entity) => ({
                    entity: entity.entity_id,
                    departure_station: entity.attributes.start,
                    arrival_station: entity.attributes.goal,
                    connections_attribute: 'departures',
                    connection_properties: {
                        description: 'products',
                        departure_time: 'departure',
                        departure_delay: 'delay',
                        arrival_time: 'arrival',
                        arrival_delay: 'delay_arrival',
                    },
                }),
            },
            hafas: {
                entityTypes: ['sensor'],
                entityAttributes: ['connections'],
                getConfig: (entity) => ({
                    entity: entity.entity_id,
                    departure_station: entity.attributes.origin,
                    arrival_station: entity.attributes.destination,
                    connections_attribute: 'connections',
                    connection_properties: {
                        description: 'products',
                        departure_time: 'departure',
                        departure_delay: 'delay',
                        arrival_time: 'arrival',
                        arrival_delay: 'delay_arrival',
                    },
                }),
            },
        };

        const defaultConfig = super.detectDefaultConfig(
            defaultConfigs,
            [...unusedEntities, ...allEntities],
            hass
        ) || {};

        return {
            ...super.getStubConfig(hass, unusedEntities, allEntities),

            departure_station: '',
            arrival_station: '',
            connections_attribute: '',
            displayed_connections: 3,
            connection_properties: {
                description: '',
                departure_time: '',
                departure_delay: '',
                arrival_time: '',
                arrival_delay: '',
            },

            ...defaultConfig,
        }
    }

    /**
     * @override
     * @inheritDoc
     */
    getConnections(stateObj) {
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
                    time: ptcTimeToStr(nextConnection[this.config.connection_properties.departure_time]),
                    delay: ptcDelayToMinutes(nextConnection[this.config.connection_properties.departure_delay]),
                    station: nextConnection[this.config.connection_properties.departure_station] || this.config.departure_station || '',
                },
                arrival: {
                    time: ptcTimeToStr(nextConnection[this.config.connection_properties.arrival_time]),
                    delay: ptcDelayToMinutes(nextConnection[this.config.connection_properties.arrival_delay]),
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
        super.checkConfig(config);

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
