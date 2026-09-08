# Cytoscape.js Attack Graph Documentation

## Graph Schema
Visual entity graph generated in `lib/attack-graph.ts` and rendered via Cytoscape.js:

- **Node Types**:
  - `EMAIL`: Root message container (color-coded by threat severity)
  - `SENDER`: Transmitting mailbox identity
  - `DOMAIN`: Registered domain stem
  - `IP`: Network routing endpoint
  - `ASN`: Autonomous System number & ISP
  - `COUNTRY`: Approximate geographic jurisdiction
  - `URL`: Embedded link destination
  - `ATTACHMENT`: Inbound file payload
  - `HASH`: Cryptographic SHA256 signature
  - `DNA`: Threat DNA hex fingerprint
  - `CAMPAIGN`: Coordinated adversary operation

- **Edge Labels**:
  - `SENT_FROM`, `DOMAIN_ORIGIN`, `RESOLVES_TO`, `ROUTED_BY`, `GEOLOCATED_IN`, `EMBEDS_LINK`, `ATTACHMENT`, `SHA256_HASH`, `FINGERPRINT_DNA`, `MEMBER_OF_CAMPAIGN`

## Interactive Features
- Node selection inspector drawer displaying raw entity metadata
- Zoom In / Zoom Out / Reset View controls
- Automatic breadthfirst hierarchical layout
