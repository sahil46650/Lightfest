/**
 * Colored console output helpers for test scripts
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
}

/**
 * Log a section header
 */
export function logSection(title: string): void {
  console.log('\n' + colors.bright + colors.cyan + '═'.repeat(80) + colors.reset)
  console.log(colors.bright + colors.cyan + `  ${title}` + colors.reset)
  console.log(colors.bright + colors.cyan + '═'.repeat(80) + colors.reset + '\n')
}

/**
 * Log a success message
 */
export function logSuccess(message: string, details?: string): void {
  console.log(colors.green + '✓ ' + colors.reset + colors.bright + message + colors.reset)
  if (details) {
    console.log(colors.dim + '  ' + details + colors.reset)
  }
}

/**
 * Log an error message
 */
export function logError(message: string, error?: unknown): void {
  console.log(colors.red + '✗ ' + colors.reset + colors.bright + message + colors.reset)
  if (error) {
    if (error instanceof Error) {
      console.log(colors.red + '  ' + error.message + colors.reset)
      if (error.stack) {
        console.log(colors.dim + error.stack + colors.reset)
      }
    } else {
      console.log(colors.red + '  ' + JSON.stringify(error, null, 2) + colors.reset)
    }
  }
}

/**
 * Log a warning message
 */
export function logWarning(message: string, details?: string): void {
  console.log(colors.yellow + '⚠ ' + colors.reset + colors.bright + message + colors.reset)
  if (details) {
    console.log(colors.dim + '  ' + details + colors.reset)
  }
}

/**
 * Log an info message
 */
export function logInfo(message: string, details?: string): void {
  console.log(colors.blue + 'ℹ ' + colors.reset + message)
  if (details) {
    console.log(colors.dim + '  ' + details + colors.reset)
  }
}

/**
 * Log a test result with pass/fail indicator and timing
 */
export function logTest(
  testName: string,
  passed: boolean,
  duration?: number,
  details?: string
): void {
  const indicator = passed ? colors.green + '✓' : colors.red + '✗'
  const status = passed ? colors.green + 'PASS' : colors.red + 'FAIL'
  const timing = duration !== undefined ? ` (${duration}ms)` : ''

  console.log(
    `${indicator} ${colors.reset}${colors.bright}${testName}${colors.reset} - ${status}${colors.reset}${colors.dim}${timing}${colors.reset}`
  )

  if (details) {
    console.log(colors.dim + '  ' + details + colors.reset)
  }
}

/**
 * Log raw data (formatted JSON)
 */
export function logData(label: string, data: unknown): void {
  console.log(colors.dim + label + ':' + colors.reset)
  console.log(JSON.stringify(data, null, 2))
}

/**
 * Log a summary of test results
 */
export function logSummary(results: {
  total: number
  passed: number
  failed: number
  duration: number
}): void {
  const { total, passed, failed, duration } = results
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0'

  console.log('\n' + colors.bright + colors.cyan + '─'.repeat(80) + colors.reset)
  console.log(colors.bright + '  Test Summary' + colors.reset)
  console.log(colors.bright + colors.cyan + '─'.repeat(80) + colors.reset)
  console.log(`  Total Tests:  ${total}`)
  console.log(colors.green + `  Passed:       ${passed}` + colors.reset)
  console.log(colors.red + `  Failed:       ${failed}` + colors.reset)
  console.log(`  Pass Rate:    ${passRate}%`)
  console.log(`  Duration:     ${duration}ms (${(duration / 1000).toFixed(2)}s)`)
  console.log(colors.bright + colors.cyan + '─'.repeat(80) + colors.reset + '\n')
}

/**
 * Start a timer and return a function to get elapsed time
 */
export function startTimer(): () => number {
  const start = Date.now()
  return () => Date.now() - start
}
