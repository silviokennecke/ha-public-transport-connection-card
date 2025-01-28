import{LitElement,html,css}from"https://unpkg.com/lit-element@2.0.1/lit-element.js?module";function ptcDelayToMinutes(delay){if(typeof delay==="number"){return delay}if(typeof delay==="string"&&delay.includes(":")){const delayParts=delay.split(":");const hours=parseInt(delayParts[0])||0;const minutes=parseInt(delayParts[1])||0;return hours*60+minutes}return parseInt(delay)||0}function ptcTimeToStr(time){const parse=Date.parse(time);return parse?new Date(parse).toLocaleTimeString([],{timeStyle:"short"}):time}function ptcTimeOffset(time,delay){const[targetHours,targetMinutes]=time.split(":").map(Number);const now=new Date;const currentHours=now.getHours();const currentMinutes=now.getMinutes();const currentTotalMinutes=currentHours*60+currentMinutes;const targetTotalMinutes=targetHours*60+targetMinutes;let offset=targetTotalMinutes-currentTotalMinutes;if(offset<-3*60){offset+=24*60}return offset+delay}function ptcParseBool(value){if(typeof value==="boolean"){return value}if(typeof value==="number"){return value!==0}if(typeof value==="string"){return value.toLowerCase()==="true"}return false}class PublicTransprtAbstractCard extends LitElement{static AVAILABLE_THEMES=["deutsche-bahn","homeassistant"];static getConfigForm(){return{schema:[{name:"entity",required:true,selector:{entity:{domain:"sensor"}}},{name:"title",selector:{text:{}}},{name:"theme",selector:{select:{options:this.AVAILABLE_THEMES,custom_value:true}}}]}}static detectDefaultConfig(defaultConfigs,entityIds,hass){const configs=Array.isArray(defaultConfigs)?defaultConfigs:Object.values(defaultConfigs);for(const defaultConfig of configs){const entityId=entityIds.find((entityId=>{const entity=hass.states[entityId];let entityChecked=false;if(defaultConfig.entityTypes){const entityType=entityId.split(".")[0];if(!defaultConfig.entityTypes.includes(entityType)){return false}entityChecked=true}if(defaultConfig.entityAttributes){let attributesExist=true;for(const attribute of defaultConfig.entityAttributes){if(entity.attributes[attribute]===undefined){attributesExist=false;break}}if(!attributesExist){return false}entityChecked=true}if(defaultConfig.isEntitySupported){return defaultConfig.isEntitySupported(entity)}if(entityChecked){return true}throw new Error("Implementation error: The default configuration object must at least provide one method for entity detection.")}));if(entityId){return defaultConfig.getConfig(hass.states[entityId])}}return undefined}static getStubConfig(hass,unusedEntities,allEntities){return{title:"",entity:"",theme:"deutsche-bahn"}}static get properties(){return{hass:{},config:{}}}static get styles(){return css`
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
        `}modifyConfig(config){return{title:"",entity:"",theme:"deutsche-bahn",...config}}checkConfig(config){if(!config.entity){throw new Error("You need to define an entity")}}setConfig(config){config=this.modifyConfig(config);this.checkConfig(config);this.config=config}render(){const title=this.config.title||"";const entityId=this.config.entity||"";const theme=this.config.theme||this.constructor.AVAILABLE_THEMES[0];const stateObj=this.hass.states[entityId];if(!stateObj){return html`
                <ha-card class="ptc-theme-${theme}">
                    ${title?html`<h1>${title}</h1>`:""}
                    <div class="not-found">Entity ${entityId} not found.</div>
                </ha-card>
            `}return html`
            <ha-card class="ptc-theme-${this.config.theme}">
                ${title?html`<h1>${title}</h1>`:""}
                ${this.renderInnerCard(stateObj)}
            </ha-card>
        `}renderInnerCard(entityState){return html`
            Not implemented. The card must implement the renderInnerCard method.
        `}handleAction(action){const event=new Event("hass-action",{bubbles:true,composed:true});event.detail={config:this.config,action:action};this.dispatchEvent(event)}}class PublicTransprtAbstractConnectionListCard extends PublicTransprtAbstractCard{static getStubConfig(hass,unusedEntities,allEntities){return{...super.getStubConfig(hass,unusedEntities,allEntities),departure_station:"",arrival_station:""}}getConnections(stateObj){return[]}renderInnerCard(entityState){const stateObj=entityState;const icon=this.config.icon||stateObj.attributes.icon||"mdi:train";const connections=this.getConnections(stateObj);const currentConnection=connections.shift();if(currentConnection===undefined){return html`
                <div class="no-connections" @click="${ev=>this.handleAction("tap")}">
                    No connections found.
                </div>
            `}return html`
            <div class="ptc-main" @click="${ev=>this.handleAction("tap")}">
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
        `}modifyConfig(config){const mergedConfig={tap_action:{action:"more-info"},...config};return super.modifyConfig(mergedConfig)}getCardSize(){return 2}getLayoutOptions(){return{grid_rows:2,grid_columns:4,grid_min_rows:2,grid_min_columns:2}}static get styles(){return css`
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
        `}}class PublicTransportDepartureCard extends PublicTransprtAbstractCard{static FIRST_DEPARTURE_LAYOUT=[["time","train"],["direction","next_stations"],[],["platform"]];static LAYOUT_PRESETS={station_departures:{firstDepartureLayout:this.FIRST_DEPARTURE_LAYOUT,columns:["time","train","next_stations","direction","platform"],layoutOptions:{grid_rows:3,grid_columns:4,grid_min_rows:2,grid_min_columns:3}},platform_departures:{firstDepartureLayout:[["train"],["direction"],[],["offset"]],columns:["train","direction","offset"],layoutOptions:{grid_rows:2,grid_columns:4,grid_min_rows:2,grid_min_columns:2}},fixed_destination:{firstDepartureLayout:this.FIRST_DEPARTURE_LAYOUT,columns:["time","train","next_stations","platform"],layoutOptions:{grid_rows:3,grid_columns:4,grid_min_rows:2,grid_min_columns:2}}};static getConfigForm(){return{schema:[...super.getConfigForm().schema,{name:"layout",required:true,selector:{select:{options:Object.keys(this.LAYOUT_PRESETS),custom_value:false}}},{name:"departures_attribute",required:true,selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"departure_properties",type:"grid",schema:[{name:"time",required:true,selector:{text:{}}},{name:"delay",selector:{text:{}}},{name:"cancelled",selector:{text:{}}},{name:"train",selector:{text:{}}},{name:"direction",required:true,selector:{text:{}}},{name:"platform",selector:{text:{}}},{name:"next_stations",selector:{text:{}}}]},{name:"destination_filter",selector:{text:{}}},{name:"displayed_departures",selector:{number:{min:1}}}]}}static getStubConfig(hass,unusedEntities,allEntities){const defaultConfigs={db_infoscreen:{entityTypes:["sensor"],entityAttributes:["next_departures"],getConfig:entity=>({entity:entity.entity_id,station:entity.attributes.station,departures_attribute:"next_departures",departure_properties:{time:"scheduledDeparture",delay:"delayDeparture",cancelled:"isCancelled",train:"train",direction:"destination",platform:"platform",next_stations:"via"}})}};const defaultConfig=super.detectDefaultConfig(defaultConfigs,[...unusedEntities,...allEntities],hass)||{};return{...super.getStubConfig(hass,unusedEntities,allEntities),layout:Object.keys(this.LAYOUT_PRESETS)[0],departures_attribute:"",departure_properties:{time:"",delay:"",cancelled:"",train:"",direction:"",platform:"",next_stations:""},destination_filter:"",displayed_departures:5,...defaultConfig}}static get styles(){return css`
            ${super.styles}

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
        `}renderInnerCard(stateObj){const departures=this._getDepartures();const layoutConfig=this.constructor.LAYOUT_PRESETS[this.config.layout];if(departures.length===0){return html`
                <div class="no-departures" @click="${ev=>this.handleAction("tap")}">
                    No departures found.
                </div>
            `}const nextDepartures=[...departures];const firstDeparture=layoutConfig.firstDepartureLayout?nextDepartures.shift():undefined;return html`
            <div class="ptcd-main ptcd-layout-${this.config.layout}" @click="${ev=>this.handleAction("tap")}">
                ${layoutConfig.firstDepartureLayout&&firstDeparture?html`
                    <div class="ptcd-row ptcd-first-departure ${firstDeparture.isCancelled?"ptcd-is-cancelled":""}">
                        ${layoutConfig.firstDepartureLayout.map((row=>html`
                            <div class="ptcd-first-departure-section ${row.length===0?"ptcd-spacer":""}">
                                ${row.map((column=>this._renderColumn(firstDeparture,column)))}
                            </div>
                        `))}
                    </div>
                `:""}
                ${nextDepartures.map((departure=>html`
                    <div class="ptcd-row ptcd-next-departure ${departure.isCancelled?"ptcd-is-cancelled":""}">
                        ${layoutConfig.columns.map((column=>this._renderColumn(departure,column)))}
                    </div>
                `))}
            </div>
        `}modifyConfig(config){const mergedConfig={tap_action:{action:"more-info"},...config};if(!mergedConfig.layout||mergedConfig.layout===""){mergedConfig.layout=Object.keys(this.constructor.LAYOUT_PRESETS)[0]}return super.modifyConfig(mergedConfig)}checkConfig(config){super.checkConfig(config);if(!Object.keys(this.constructor.LAYOUT_PRESETS).includes(config.layout)){throw new Error("You must define a valid layout. Available layouts: "+Object.keys(this.constructor.LAYOUT_PRESETS).join(", "))}if(!config.departures_attribute||config.departures_attribute===""){throw new Error("You must define which attribute of the sensor holds the departures as array.")}if(!config.departure_properties){throw new Error("You must define the departure_properties.")}if(!config.departure_properties.time){throw new Error("You must define the time property for the departure entries.")}if(!config.departure_properties.direction){throw new Error("You must define the direction property for the departure entries.")}if(!config.displayed_departures||config.displayed_departures<1){throw new Error("displayed_connections must be set to 1 or higher")}}getCardSize(){return this.constructor.LAYOUT_PRESETS[this.config.layout||""].cardSize||2}getLayoutOptions(){return this.constructor.LAYOUT_PRESETS[this.config.layout||""].layoutOptions||{grid_rows:2,grid_columns:4,grid_min_rows:2,grid_min_columns:2}}_getDepartures(){const stateObj=this.hass.states[this.config.entity];const stateDepartures=stateObj.attributes[this.config.departures_attribute]||[];const departures=[];for(let i=0;i<stateDepartures.length&&departures.length<this.config.displayed_departures;i++){const stateDeparture=stateDepartures[i];const departure={time:ptcTimeToStr(stateDeparture[this.config.departure_properties.time]||""),delay:0,isCancelled:false,train:"",direction:stateDeparture[this.config.departure_properties.direction]||"",platform:"",nextStations:[]};if(this.config.departure_properties.delay){departure.delay=ptcDelayToMinutes(stateDeparture[this.config.departure_properties.delay]||0)}if(this.config.departure_properties.cancelled){departure.isCancelled=ptcParseBool(stateDeparture[this.config.departure_properties.cancelled]||false)}if(this.config.departure_properties.train){departure.train=stateDeparture[this.config.departure_properties.train]||""}if(this.config.departure_properties.platform){departure.platform=stateDeparture[this.config.departure_properties.platform]||""}if(this.config.departure_properties.next_stations){departure.nextStations=stateDeparture[this.config.departure_properties.next_stations]||[]}if(this.config.destination_filter){const filter=this.config.destination_filter.toUpperCase();if(!departure.direction.toUpperCase().includes(filter)&&!departure.nextStations.join("; ").toUpperCase().includes(filter)){continue}}departures.push(departure)}return departures}_renderColumn(departure,columnType){switch(columnType){case"time":return html`
                    <div class="ptcd-time-departure">
                        ${departure.time}
                        ${departure.delay>0?html`+ ${departure.delay}`:""}
                    </div>
                `;case"offset":const offset=ptcTimeOffset(departure.time,departure.delay);return html`
                    <div class="ptcd-time-departure-offset">${offset}</div>
                `;case"train":return html`
                    <div class="ptcd-train">${departure.train}</div>
                `;case"direction":return html`
                    <div class="ptcd-direction">${departure.direction}</div>
                `;case"next_stations":return html`
                    <div class="ptcd-next-stations">${departure.nextStations.join(", ")}</div>
                `;case"platform":return html`
                    <div class="ptcd-platform">
                        ${departure.platform}
                    </div>
                `;case"spacer":return html`
                    <div class="ptcd-spacer"></div>
                `;default:return""}}}customElements.define("public-transport-departures-card",PublicTransportDepartureCard);window.customCards=window.customCards||[];window.customCards.push({type:"public-transport-departures-card",name:"Public Transport Departures",preview:true,description:"Display your next departures from a station.",documentationURL:"https://github.com/silviokennecke/ha-public-transport-connection-card/wiki/Public-Transport-Departures-Card"});class MultiPublicTransportConnectionCard extends PublicTransprtAbstractConnectionListCard{static getConfigForm(){return{schema:[...super.getConfigForm().schema,{name:"icon",selector:{icon:{}}},{name:"departure_station",selector:{text:{}}},{name:"arrival_station",selector:{text:{}}},{name:"connections_attribute",required:true,selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"connection_properties",type:"grid",schema:[{name:"description",selector:{text:{}}},{name:"departure_time",selector:{text:{}}},{name:"departure_delay",selector:{text:{}}},{name:"arrival_time",selector:{text:{}}},{name:"arrival_delay",selector:{text:{}}}]},{name:"displayed_connections",selector:{number:{min:1}}}]}}static getStubConfig(hass,unusedEntities,allEntities){const defaultConfigs={ha_deutschebahn:{entityTypes:["sensor"],entityAttributes:["departures"],getConfig:entity=>({entity:entity.entity_id,departure_station:entity.attributes.start,arrival_station:entity.attributes.goal,connections_attribute:"departures",connection_properties:{description:"products",departure_time:"departure",departure_delay:"delay",arrival_time:"arrival",arrival_delay:"delay_arrival"}})},hafas:{entityTypes:["sensor"],entityAttributes:["connections"],getConfig:entity=>({entity:entity.entity_id,departure_station:entity.attributes.origin,arrival_station:entity.attributes.destination,connections_attribute:"connections",connection_properties:{description:"products",departure_time:"departure",departure_delay:"delay",arrival_time:"arrival",arrival_delay:"delay_arrival"}})}};const defaultConfig=super.detectDefaultConfig(defaultConfigs,[...unusedEntities,...allEntities],hass)||{};return{...super.getStubConfig(hass,unusedEntities,allEntities),departure_station:"",arrival_station:"",connections_attribute:"",displayed_connections:3,connection_properties:{description:"",departure_time:"",departure_delay:"",arrival_time:"",arrival_delay:""},...defaultConfig}}getConnections(stateObj){const connections=[];const nextConnections=stateObj.attributes[this.config.connections_attribute]||[];for(let i=0;i<this.config.displayed_connections&&i<nextConnections.length;i++){const nextConnection=nextConnections[i];if(nextConnection===undefined){continue}const nextDescription=nextConnection[this.config.connection_properties.description]||"";connections.push({description:Array.isArray(nextDescription)?nextDescription.join(", "):nextDescription,departure:{time:ptcTimeToStr(nextConnection[this.config.connection_properties.departure_time]),delay:ptcDelayToMinutes(nextConnection[this.config.connection_properties.departure_delay]),station:nextConnection[this.config.connection_properties.departure_station]||this.config.departure_station||""},arrival:{time:ptcTimeToStr(nextConnection[this.config.connection_properties.arrival_time]),delay:ptcDelayToMinutes(nextConnection[this.config.connection_properties.arrival_delay]),station:nextConnection[this.config.connection_properties.arrival_station]||this.config.arrival_station||""}})}return connections}checkConfig(config){super.checkConfig(config);if(!config.displayed_connections||config.displayed_connections<1){throw new Error("displayed_connections must be set to 1 or higher")}if(!config.connections_attribute){throw new Error("You must define the connections_attribute")}if(!config.connection_properties.departure_time){throw new Error("You must define the departure_time property for connection entries")}if(!config.connection_properties.arrival_time){throw new Error("You must define the arrival_time property for connection entries")}}}customElements.define("public-transport-connections-card",MultiPublicTransportConnectionCard);window.customCards=window.customCards||[];window.customCards.push({type:"public-transport-connections-card",name:"Public Transport Connections",preview:true,description:"Display your next connections via public transportation.",documentationURL:"https://github.com/silviokennecke/ha-public-transport-connection-card/wiki/Public-Transport-Connection-Card#multiple-connections"});class SinglePublicTransportConnectionCard extends PublicTransprtAbstractConnectionListCard{static getConfigForm(){return{schema:[...super.getConfigForm().schema,{name:"icon",selector:{icon:{}}},{name:"departure_station",selector:{text:{}}},{name:"arrival_station",selector:{text:{}}},{name:"attributes",type:"grid",schema:[{name:"description",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"departure_time",required:true,selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"departure_delay",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"departure_station",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"arrival_time",required:true,selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"arrival_delay",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"arrival_station",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"next_departure_time",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"next_departure_delay",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"next_departure_station",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"next_arrival_time",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"next_arrival_delay",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}},{name:"next_arrival_station",selector:{attribute:{entity_id:""}},context:{filter_entity:"entity"}}]}]}}static getStubConfig(hass,unusedEntities,allEntities){return{...super.getStubConfig(hass,unusedEntities,allEntities),attributes:{description:"",departure_time:"",departure_delay:"",departure_station:"",arrival_time:"",arrival_delay:"",arrival_station:"",next_departure_time:"",next_departure_delay:"",next_departure_station:"",next_arrival_time:"",next_arrival_delay:"",next_arrival_station:""}}}getConnections(stateObj){const connections=[];const description=stateObj.attributes[this.config.attributes.description]||"";connections.push({description:Array.isArray(description)?description.join(", "):description,departure:{time:ptcTimeToStr(stateObj.attributes[this.config.attributes.departure_time]),delay:ptcDelayToMinutes(stateObj.attributes[this.config.attributes.departure_delay]),station:stateObj.attributes[this.config.attributes.departure_station]||this.config.departure_station||""},arrival:{time:ptcTimeToStr(stateObj.attributes[this.config.attributes.arrival_time]),delay:ptcDelayToMinutes(stateObj.attributes[this.config.attributes.arrival_delay]),station:stateObj.attributes[this.config.attributes.arrival_station]||this.config.arrival_station||""}});if(this.config.attributes.next_departure_time&&this.config.attributes.next_arrival_time){const nextDescription=stateObj.attributes[this.config.attributes.next_description]||"";connections.push([{description:Array.isArray(nextDescription)?nextDescription.join(", "):nextDescription,departure:{time:ptcTimeToStr(stateObj.attributes[this.config.attributes.next_departure_time]),delay:ptcDelayToMinutes(stateObj.attributes[this.config.attributes.next_departure_delay]),station:stateObj.attributes[this.config.attributes.next_departure_station]||this.config.departure_station||""},arrival:{time:ptcTimeToStr(stateObj.attributes[this.config.attributes.next_arrival_time]),delay:ptcDelayToMinutes(stateObj.attributes[this.config.attributes.next_arrival_delay]),station:stateObj.attributes[this.config.attributes.next_arrival_station]||this.config.arrival_station||""}}])}return connections}checkConfig(config){super.checkConfig(config);if(!config.attributes.departure_time){throw new Error("You need to define the departure attribute")}if(!config.attributes.arrival_time){throw new Error("You need to define the arrival attribute")}if(config.attributes.next_departure_time&&!config.attributes.next_arrival_time){throw new Error("If you define the next_departure attribute, you need to also define the next_arrival attribute")}}}customElements.define("public-transport-connections-attributes-card",SinglePublicTransportConnectionCard);window.customCards=window.customCards||[];window.customCards.push({type:"public-transport-connections-attributes-card",name:"Public Transport Connections (via Attributes)",preview:false,description:"Display your current and next connection via public transportation.",documentationURL:"https://github.com/silviokennecke/ha-public-transport-connection-card/wiki/Public-Transport-Connection-Card#single-connection"});