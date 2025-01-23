function delayToMinutes(delay){if(typeof delay==="number"){return delay}if(typeof delay==="string"&&delay.includes(":")){const delayParts=delay.split(":");const hours=parseInt(delayParts[0])||0;const minutes=parseInt(delayParts[1])||0;return hours*60+minutes}return parseInt(delay)||0}function timeToStr(time){const parse=Date.parse(time);return parse?new Date(parse).toLocaleTimeString([],{timeStyle:"short"}):time}import{LitElement,html,css}from"https://unpkg.com/lit-element@2.0.1/lit-element.js?module";class AbstractConnectionListCard extends LitElement{static AVAILABLE_THEMES=["deutsche-bahn","homeassistant"];static getStubConfig(hass,unusedEntities,allEntities){return{title:"",departure_station:"",arrival_station:"",entity:entityId,theme:"deutsche-bahn"}}static get properties(){return{hass:{},config:{}}}getConnections(entityId,stateObj){return[]}render(){const title=this.config.title;const entityId=this.config.entity;const theme=this.config.theme;const stateObj=this.hass.states[entityId];if(!stateObj){return html`
                <ha-card class="ptc-theme-${theme}">
                    ${title?html`<h1>${title}</h1>`:""}
                    <div class="not-found">Entity ${entityId} not found.</div>
                </ha-card>
            `}const icon=this.config.icon||stateObj.attributes.icon||"mdi:train";const connections=this.getConnections(entityId,stateObj);const currentConnection=connections.shift();if(currentConnection===undefined){return html`
                <ha-card class="ptc-theme-${theme}">
                    ${title?html`<h1>${title}</h1>`:""}
                    <div class="no-connections" @click="${ev=>this._handleAction("tap")}">
                        No connections found.
                    </div>
                </ha-card>
            `}return html`
            <ha-card class="ptc-theme-${theme}">
                ${title?html`<h1>${title}</h1>`:""}
                <div class="ptc-main" @click="${ev=>this._handleAction("tap")}">
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
                            ${currentConnection.departure.delay>0?html`+ ${currentConnection.departure.delay}`:""}
                        </div>
                        <div class="ptc-connection-description">${currentConnection.description}</div>
                        <div class="ptc-time-arrival">
                            ${currentConnection.arrival.time}
                            ${currentConnection.arrival.delay>0?html`+ ${currentConnection.arrival.delay}`:""}
                        </div>
                    </div>
                    ${connections.map((connection=>html`
                        <div class="ptc-row ptc-connection ptc-next-connection">
                            <div class="ptc-time-departure">
                                ${connection.departure.time}
                                ${connection.departure.delay>0?html`+ ${connection.departure.delay}`:""}
                            </div>
                            <div class="ptc-connection-description">${connection.description}</div>
                            <div class="ptc-time-arrival">
                                ${connection.arrival.time}
                                ${connection.arrival.delay>0?html`+ ${connection.arrival.delay}`:""}
                            </div>
                        </div>
                    `))}
                </div>
            </ha-card>
        `}checkConfig(config){if(!config.entity){throw new Error("You need to define an entity")}}setConfig(config){this.checkConfig(config);this.config={tap_action:{action:"more-info"},...config}}getCardSize(){return 2}getLayoutOptions(){return{grid_rows:2,grid_columns:4,grid_min_rows:2,grid_min_columns:2}}_handleAction(action){const event=new Event("hass-action",{bubbles:true,composed:true});event.detail={config:this.config,action:action};this.dispatchEvent(event)}static get styles(){return css`
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
        `}}class MultiPublicTransportConnectionCard extends AbstractConnectionListCard{static getConfigForm(){return{schema:[{name:"entity",required:true,selector:{entity:{domain:"sensor"}}},{name:"title",selector:{text:{}}},{name:"icon",selector:{icon:{}}},{name:"departure_station",selector:{text:{}}},{name:"arrival_station",selector:{text:{}}},{name:"connections_attribute",required:true,selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"connection_properties",type:"grid",schema:[{name:"description",selector:{text:{}}},{name:"departure_time",selector:{text:{}}},{name:"departure_delay",selector:{text:{}}},{name:"arrival_time",selector:{text:{}}},{name:"arrival_delay",selector:{text:{}}}]},{name:"displayed_connections",selector:{number:{min:1}}},{name:"theme",selector:{select:{options:AbstractConnectionListCard.AVAILABLE_THEMES,custom_value:true}}}]}}static getStubConfig(hass,unusedEntities,allEntities){const defaultAttributes={connections:["departures","connections"],departureStation:["start","origin"],arrivalStation:["goal","destination"]};function getAttributeName(entityId,defaultAttributes){const entity=hass.states[entityId]??{attributes:{}};for(const attribute of defaultAttributes){if(entity.attributes[attribute]!==undefined){return attribute}}return undefined}function getAttribute(entityId,defaultAttributes,defaultValue=undefined){const entity=hass.states[entityId]??{attributes:{}};const attributeName=getAttributeName(entityId,defaultAttributes);if(attributeName===undefined){return defaultValue}else{return entity.attributes[attributeName]}}function isPublicTransportSensor(entityId){if(entityId.split(".")[0]!=="sensor"){return false}return getAttributeName(entityId,defaultAttributes.connections)!==undefined}let entityId=unusedEntities.find(isPublicTransportSensor);if(!entityId){entityId=allEntities.find(isPublicTransportSensor)||""}return{...AbstractConnectionListCard.getStubConfig(hass,unusedEntities,allEntities),departure_station:getAttribute(entityId,defaultAttributes.departureStation,""),arrival_station:getAttribute(entityId,defaultAttributes.arrivalStation,""),connections_attribute:getAttributeName(entityId,defaultAttributes.connections),connection_properties:{description:"products",departure_time:"departure",departure_delay:"delay",arrival_time:"arrival",arrival_delay:"delay_arrival"},displayed_connections:3}}getConnections(entityId,stateObj){const connections=[];const nextConnections=stateObj.attributes[this.config.connections_attribute]||[];for(let i=0;i<this.config.displayed_connections&&i<nextConnections.length;i++){const nextConnection=nextConnections[i];if(nextConnection===undefined){continue}const nextDescription=nextConnection[this.config.connection_properties.description]||"";connections.push({description:Array.isArray(nextDescription)?nextDescription.join(", "):nextDescription,departure:{time:timeToStr(nextConnection[this.config.connection_properties.departure_time]),delay:delayToMinutes(nextConnection[this.config.connection_properties.departure_delay]),station:nextConnection[this.config.connection_properties.departure_station]||this.config.departure_station||""},arrival:{time:timeToStr(nextConnection[this.config.connection_properties.arrival_time]),delay:delayToMinutes(nextConnection[this.config.connection_properties.arrival_delay]),station:nextConnection[this.config.connection_properties.arrival_station]||this.config.arrival_station||""}})}return connections}checkConfig(config){if(!config.displayed_connections||config.displayed_connections<1){throw new Error("displayed_connections must be set to 1 or higher")}if(!config.connections_attribute){throw new Error("You must define the connections_attribute")}if(!config.connection_properties.departure_time){throw new Error("You must define the departure_time property for connection entries")}if(!config.connection_properties.arrival_time){throw new Error("You must define the arrival_time property for connection entries")}}}customElements.define("public-transport-connections-card",MultiPublicTransportConnectionCard);window.customCards=window.customCards||[];window.customCards.push({type:"public-transport-connections-card",name:"Public Transport Connections",preview:true,description:"Display your next connections via public transportation.",documentationURL:"https://github.com/silviokennecke/ha-public-transport-connection-card/wiki/Public-Transport-Connection-Card#multiple-connections"});class SinglePublicTransportConnectionCard extends AbstractConnectionListCard{static getConfigForm(){return{schema:[{name:"entity",required:true,selector:{entity:{domain:"sensor"}}},{name:"title",selector:{text:{}}},{name:"icon",selector:{icon:{}}},{name:"departure_station",selector:{text:{}}},{name:"arrival_station",selector:{text:{}}},{name:"attributes",type:"grid",schema:[{name:"description",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"departure_time",required:true,selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"departure_delay",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"departure_station",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"arrival_time",required:true,selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"arrival_delay",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"arrival_station",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"next_departure_time",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"next_departure_delay",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"next_departure_station",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"next_arrival_time",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"next_arrival_delay",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"next_arrival_station",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}}]},{name:"theme",selector:{select:{options:AbstractConnectionListCard.AVAILABLE_THEMES,custom_value:true}}}]}}static getStubConfig(hass,unusedEntities,allEntities){return{...AbstractConnectionListCard.getStubConfig(hass,unusedEntities,allEntities),attributes:{description:"",departure_time:"",departure_delay:"",departure_station:"",arrival_time:"",arrival_delay:"",arrival_station:"",next_departure_time:"",next_departure_delay:"",next_departure_station:"",next_arrival_time:"",next_arrival_delay:"",next_arrival_station:""}}}getConnections(entityId,stateObj){const connections=[];const description=stateObj.attributes[this.config.attributes.description]||"";connections.push({description:Array.isArray(description)?description.join(", "):description,departure:{time:timeToStr(stateObj.attributes[this.config.attributes.departure_time]),delay:delayToMinutes(stateObj.attributes[this.config.attributes.departure_delay]),station:stateObj.attributes[this.config.attributes.departure_station]||this.config.departure_station||""},arrival:{time:timeToStr(stateObj.attributes[this.config.attributes.arrival_time]),delay:delayToMinutes(stateObj.attributes[this.config.attributes.arrival_delay]),station:stateObj.attributes[this.config.attributes.arrival_station]||this.config.arrival_station||""}});if(this.config.attributes.next_departure_time&&this.config.attributes.next_arrival_time){const nextDescription=stateObj.attributes[this.config.attributes.next_description]||"";connections.push([{description:Array.isArray(nextDescription)?nextDescription.join(", "):nextDescription,departure:{time:timeToStr(stateObj.attributes[this.config.attributes.next_departure_time]),delay:delayToMinutes(stateObj.attributes[this.config.attributes.next_departure_delay]),station:stateObj.attributes[this.config.attributes.next_departure_station]||this.config.departure_station||""},arrival:{time:timeToStr(stateObj.attributes[this.config.attributes.next_arrival_time]),delay:delayToMinutes(stateObj.attributes[this.config.attributes.next_arrival_delay]),station:stateObj.attributes[this.config.attributes.next_arrival_station]||this.config.arrival_station||""}}])}return connections}checkConfig(config){if(!config.attributes.departure_time){throw new Error("You need to define the departure attribute")}if(!config.attributes.arrival_time){throw new Error("You need to define the arrival attribute")}if(config.attributes.next_departure_time&&!config.attributes.next_arrival_time){throw new Error("If you define the next_departure attribute, you need to also define the next_arrival attribute")}}}customElements.define("public-transport-connections-attributes-card",SinglePublicTransportConnectionCard);window.customCards=window.customCards||[];window.customCards.push({type:"public-transport-connections-attributes-card",name:"Public Transport Connections (via Attributes)",preview:false,description:"Display your current and next connection via public transportation.",documentationURL:"https://github.com/silviokennecke/ha-public-transport-connection-card/wiki/Public-Transport-Connection-Card#single-connection"});
