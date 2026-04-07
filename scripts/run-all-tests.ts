#!/usr/bin/env ts-node
/**
 * Test Runner - Executes all test suites and provides consolidated results
 */

import { spawn } from 'child_process'
import { logSection, logSuccess, logError, logInfo, logSummary, startTimer } from './helpers/logger'

interface TestSuiteResult {
  name: string
  command: string
  passed: boolean
  duration: number
  output: string
}

async function runTestSuite(name: string, command: string): Promise<TestSuiteResult> {
  return new Promise((resolve) => {
    const timer = startTimer()
    let output = ''

    logInfo(`Running ${name}...`)

    const child = spawn('npm', ['run', command], {
      cwd: process.cwd(),
      shell: true,
    })

    child.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      process.stdout.write(text)
    })

    child.stderr.on('data', (data) => {
      const text = data.toString()
      output += text
      process.stderr.write(text)
    })

    child.on('close', (code) => {
      const duration = timer()
      resolve({
        name,
        command,
        passed: code === 0,
        duration,
        output,
      })
    })
  })
}

async function main() {
  const totalTimer = startTimer()

  logSection('E-Commerce Test Suite Runner')
  logInfo('Running all test suites...')
  logInfo('This will take approximately 2 minutes')

  const testSuites = [
    { name: 'Booking Flow', command: 'test:booking-flow' },
    { name: 'Inventory Validation', command: 'test:inventory' },
    { name: 'Email Queue', command: 'test:email' },
    { name: 'Cleanup Operations', command: 'test:cleanup' },
    { name: 'Promo Codes', command: 'test:promo' },
  ]

  const results: TestSuiteResult[] = []

  // Run each test suite sequentially
  for (const suite of testSuites) {
    logSection(suite.name)
    const result = await runTestSuite(suite.name, suite.command)
    results.push(result)

    if (result.passed) {
      logSuccess(`${suite.name} completed successfully`)
    } else {
      logError(`${suite.name} failed`)
    }

    console.log('\n')
  }

  // Print summary
  const totalDuration = totalTimer()
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  logSection('Test Suite Summary')

  results.forEach((result) => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL'
    const color = result.passed ? '\x1b[32m' : '\x1b[31m'
    const reset = '\x1b[0m'
    const durationSec = (result.duration / 1000).toFixed(2)

    console.log(`${color}${status}${reset} ${result.name} (${durationSec}s)`)
  })

  console.log('')

  logSummary({
    total: results.length,
    passed,
    failed,
    duration: totalDuration,
  })

  if (failed === 0) {
    logSuccess('All test suites passed!')
    logInfo('System is ready for deployment')
  } else {
    logError(`${failed} test suite(s) failed`)
    logInfo('Review the output above for details')

    logSection('Failed Test Suites')
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        logError(r.name)
      })
  }

  process.exit(failed > 0 ? 1 : 0)
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    logError('Test runner failed', error)
    process.exit(1)
  })
}
