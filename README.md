# Relay

Relay is a system that enables quick reporting of equipment faults by scanning QR codes placed on hardware. The entire system is based on a central API server that communicates with three platforms: web, mobile, and desktop applications. The system supports installers, service technicians, and end-users, allowing them to conveniently generate QR codes, report faults, and manage reports.

## Project Goal

The goal of the application is to enable installers and service technicians to generate a QR code for an installed device, containing all the information necessary for future fault reporting. A QR code placed on the device allows anyone—a company employee, an end-user, or a bystander—to quickly report a failure, and the technician to immediately receive the full context of the event.

The system is designed to shorten response times, improve communication, and provide a full history of devices and reports.

## Example Usage

Installer X installs device Y at company Z. After completing the installation, they generate a QR code containing information about the device (location, type, installation date, serial number, additional notes). The code is printed and attached to the device.

Some time later, an employee at company Z notices that device Y is not working correctly. They scan the QR code with their phone, which takes them to a reporting form in a browser or mobile app. They fill in the description of the fault, add photos, and provide contact details.

## Development Tasks

The project includes a `Makefile` to simplify typical development tasks using `pnpm`.

| Command          | Description                                       |
|:-----------------|:--------------------------------------------------|
| `make install`   | Install project dependencies                      |
| `make dev`       | Start the development server with hot-reloading   |
| `make build`     | Build the application for production              |
| `make lint`      | Check code style and errors using Biome           |
| `make fix`  | Automatically fix code style errors               |
| `make typecheck` | Run the TypeScript compiler to check for errors   |
| `make clean`     | Remove development and build artifacts            |
| `make release`   | Create a production release and publish it        |
| `make help`      | Display the list of available commands            |
