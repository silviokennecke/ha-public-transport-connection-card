# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2025-02-02

### Added

- Added `public-transport-departures-card`

### Changed

- Restructured the repository for better maintainability
- Extracted the connections card using static attributes for current and next connection into a separate card `public-transport-connections-attributes-card`
- Extracted the connections card using a connections attribute, containing an array of connections, into a separate card `public-transport-connections-card`

## [2.0.1] - 2025-01-15

### Fixed

- Fixed display issues for the delay on iOS (#21)

## [2.0.0] - 2025-01-03

This release is a breaking change, as the repository name has been changed and the built JS file also had to be renamed.
The implementation did not change.

### Changed

- Change the repository name to `ha-public-transport-connection-card`

## [1.2.0] - 2025-01-02

### Added

- Added configuration schema to allow card configuration via UI (#14)

### Fixed

- Fixed display issues for the delay and times when using [akloeckner/hacs-hafas](https://github.com/akloeckner/hacs-hafas) (#11)

## [1.1.1]

### Fixed

- Fixed styling issues for connections, causing that the description was not centered if the departure and arrival time did not have the same length (e.g. due to a displayed delay)

## [1.1.0] - 2024-01-20

### Added

- Allow displaying more than the next two connections (#9)

## [1.0.1] - 2023-12-09

### Fixed

- Add spacer if multiple products are used (#6)

## [1.0.0] - 2023-10-19

### Added

- Added public transport card

[unreleased]: https://github.com/silviokennecke/ha-public-transport-connection-card/compare/1.2.0...HEAD
[3.0.0]: https://github.com/silviokennecke/ha-public-transport-connection-card/compare/2.0.1...3.0.0
[2.0.1]: https://github.com/silviokennecke/ha-public-transport-connection-card/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/silviokennecke/ha-public-transport-connection-card/compare/1.2.0...2.0.0
[1.2.0]: https://github.com/silviokennecke/ha-public-transport-connection-card/compare/1.1.1...1.2.0
[1.1.1]: https://github.com/silviokennecke/ha-public-transport-connection-card/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/silviokennecke/ha-public-transport-connection-card/compare/1.0.1...1.1.0
[1.0.1]: https://github.com/silviokennecke/ha-public-transport-connection-card/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/silviokennecke/ha-public-transport-connection-card/releases/tag/1.0.0
