import { Logger } from '@nestjs/common';

// Only show errors during tests to keep output clean
Logger.overrideLogger(['error']);
