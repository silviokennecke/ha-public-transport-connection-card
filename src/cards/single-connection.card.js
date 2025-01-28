class SinglePublicTransportConnectionCard extends PublicTransprtAbstractConnectionListCard {
    static getConfigForm() {
        return {
            schema: [
                ...super.getConfigForm().schema,

                {name: "icon", selector: {icon: {}}},
                {name: "departure_station", selector: {text: {}}},
                {name: "arrival_station", selector: {text: {}}},
                {
                    name: "attributes",
                    type: "grid",
                    schema: [
                        {
                            name: "description",
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                        {
                            name: "departure_time",
                            required: true,
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                        {
                            name: "departure_delay",
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                        {
                            name: "departure_station",
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                        {
                            name: "arrival_time",
                            required: true,
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                        {
                            name: "arrival_delay",
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                        {
                            name: "arrival_station",
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                        {
                            name: "next_departure_time",
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                        {
                            name: "next_departure_delay",
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                        {
                            name: "next_departure_station",
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                        {
                            name: "next_arrival_time",
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                        {
                            name: "next_arrival_delay",
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                        {
                            name: "next_arrival_station",
                            selector: {
                                attribute: {entity_id: ""}
                            },
                            context: {
                                filter_entity: "entity"
                            }
                        },
                    ],
                },
            ],
        };
    }

    /**
     * @override
     * @inheritDoc
     */
    static getStubConfig(hass, unusedEntities, allEntities) {
        return {
            ...super.getStubConfig(hass, unusedEntities, allEntities),
            attributes: {
                description: '',
                departure_time: '',
                departure_delay: '',
                departure_station: '',
                arrival_time: '',
                arrival_delay: '',
                arrival_station: '',
                next_departure_time: '',
                next_departure_delay: '',
                next_departure_station: '',
                next_arrival_time: '',
                next_arrival_delay: '',
                next_arrival_station: '',
            },
        };
    }

    /**
     * @override
     * @inheritDoc
     */
    getConnections(stateObj) {
        /** @type {Array<ConnectionDetail>} */
        const connections = [];

        const description = stateObj.attributes[this.config.attributes.description] || '';

        connections.push({
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
        });

        if (this.config.attributes.next_departure_time && this.config.attributes.next_arrival_time) {
            const nextDescription = stateObj.attributes[this.config.attributes.next_description] || '';

            connections.push([
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
            ]);
        }

        return connections;
    }

    /**
     * @override
     * @inheritDoc
     */
    checkConfig(config) {
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
}

customElements.define("public-transport-connections-attributes-card", SinglePublicTransportConnectionCard);
window.customCards = window.customCards || [];
window.customCards.push({
    type: "public-transport-connections-attributes-card",
    name: "Public Transport Connections (via Attributes)",
    preview: false,
    description: "Display your current and next connection via public transportation.",
    documentationURL: "https://github.com/silviokennecke/ha-public-transport-connection-card/wiki/Public-Transport-Connection-Card#single-connection",
});
