# Architecture

Answer each of these, in your own words, once the system has taken real shape.

- What are the moving pieces, and how do they talk to each other?
- Where does each piece run?
- What is the request path for one representative user action, end to end?
- What did you decide *not* to build, and why?

# System Architecture

## Overview

The application follows a MERN-based client-server architecture.

```text
React Client
     |
     | HTTP / REST API
     v
Express + Node.js Server
     |
     +---- Authentication & Authorization
     |
     +---- Subscription APIs
     |
     +---- Invoice APIs
     |
     +---- Reporting APIs
     |
     v
MongoDB