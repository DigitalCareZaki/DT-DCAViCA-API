import puppeteer, { Browser, Page, ElementHandle, JSHandle } from 'puppeteer';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== TYPES & INTERFACES ====================

interface VivalinkDoctorData {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    position?: string;
    site?: string;
    role?: VivalinkRole;
}

interface VivalinkSyncResult {
    success: boolean;
    error?: string;
    details?: Record<string, unknown>;
}

interface BrowserSession {
    browser: Browser;
    page: Page;
}

interface PortalConfig {
    readonly url: string;
    readonly email: string;
    readonly password: string;
}

interface TimeoutConfig {
    readonly navigation: number;
    readonly selector: number;
    readonly dropdown: number;
    readonly formRetry: number;
    readonly submission: number;
}

type VivalinkRole = 'Physician' | 'Admin' | 'Nurse' | 'Technician';
type SubmissionResult = 'navigation' | 'success' | 'validation_error' | 'timeout' | null;

// ==================== CONSTANTS ====================

const PORTAL_CONFIG: PortalConfig = {
    url: 'https://webportal.vivalink.com',
    email: process.env.VL_PORTAL_EMAIL ?? 'vivalink4VVE-14@outlook.com',
    password: process.env.VL_PORTAL_PASSWORD ?? 'Uc7%!D0)U9',
} as const;

const TIMEOUTS: TimeoutConfig = {
    navigation: 60000,
    selector: 30000,
    dropdown: 5000,
    formRetry: 5000,
    submission: 60000,
} as const;

const SELECTORS = {
    emailInput: 'input[name="email"]',
    passwordInput: 'input[name="password"]',
    submitButton: 'button[type="submit"]',
    form: 'form, #user-form, .ant-form',
    email: '#email, input[name="email"]',
    phone: '#phoneNumber, #phone, input[name="phoneNumber"], input[name="phone"]',
    firstName: '#firstName, input[name="firstName"]',
    lastName: '#lastName, input[name="lastName"]',
    position: '#position, input[name="position"]',
    site: '#site',
    role: '#role',
    dropdown: '.ant-select-dropdown:not(.ant-select-dropdown-hidden)',
    dropdownOption: '.ant-select-item-option',
    formError: '.ant-form-item-explain-error, .ant-message-error',
    successMessage: '.success-message, .ant-message-success',
} as const;

const FORM_RETRY_ATTEMPTS = 6;

// ==================== LOGGER ====================

interface Logger {
    info: (message: string) => void;
    error: (message: string, error?: unknown) => void;
    warn: (message: string) => void;
    debug: (message: string) => void;
}

const logger: Logger = {
    info: (message: string): void => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    },
    error: (message: string, error?: unknown): void => {
        const errorMessage = error instanceof Error ? error.message : String(error ?? '');
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, errorMessage);
    },
    warn: (message: string): void => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
    },
    debug: (message: string): void => {
        if (process.env.DEBUG === 'true') {
            console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
        }
    },
};

// ==================== UTILITY FUNCTIONS ====================

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error ?? 'Unknown error');
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureScreenshot(page: Page, filename: `${string}.png` | `${string}.jpeg` | `${string}.webp`): Promise<void> {
    try {
        await page.screenshot({ path: filename });
        logger.debug(`Screenshot saved: ${filename}`);
    } catch (error) {
        logger.warn(`Failed to capture screenshot: ${getErrorMessage(error)}`);
    }
}

async function extractPageErrors(page: Page): Promise<string> {
    try {
        return await page.evaluate((selector: string) => {
            const errors = document.querySelectorAll(selector);
            return Array.from(errors)
                .map((el) => el.textContent?.trim())
                .filter(Boolean)
                .join(', ');
        }, SELECTORS.formError);
    } catch {
        return '';
    }
}

// ==================== BROWSER MANAGEMENT ====================

async function launchBrowser(): Promise<Browser> {
    logger.info('Launching browser...');
    return puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
        defaultViewport: { width: 1920, height: 1080 },
    });
}

async function closeBrowser(browser: Browser): Promise<void> {
    try {
        await browser.close();
        logger.debug('Browser closed successfully');
    } catch (error) {
        logger.error('Error closing browser', error);
    }
}

async function createPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    return page;
}

// ==================== AUTHENTICATION ====================

async function login(): Promise<BrowserSession | null> {
    let browser: Browser | null = null;

    try {
        browser = await launchBrowser();
        const page = await createPage(browser);

        logger.info(`Navigating to ${PORTAL_CONFIG.url}/sign-in`);
        await page.goto(`${PORTAL_CONFIG.url}/sign-in`, {
            waitUntil: 'networkidle0',
            timeout: TIMEOUTS.navigation,
        });

        await page.waitForSelector(SELECTORS.emailInput, { timeout: TIMEOUTS.selector });
        await page.type(SELECTORS.emailInput, PORTAL_CONFIG.email);

        await page.waitForSelector(SELECTORS.passwordInput, { timeout: TIMEOUTS.selector });
        await page.type(SELECTORS.passwordInput, PORTAL_CONFIG.password);

        await page.click(SELECTORS.submitButton);
        await page.waitForNavigation({ timeout: TIMEOUTS.navigation });

        logger.info('Successfully logged into Vivalink portal');
        return { browser, page };
    } catch (error) {
        logger.error('Failed to login to Vivalink portal', error);
        if (browser) {
            await closeBrowser(browser);
        }
        return null;
    }
}

// ==================== FORM HELPERS ====================

async function waitForForm(page: Page): Promise<boolean> {
    for (let attempt = 1; attempt <= FORM_RETRY_ATTEMPTS; attempt++) {
        try {
            const formElement = await page.$(SELECTORS.form);
            if (formElement) {
                logger.info('User form found!');
                return true;
            }
        } catch (error) {
            logger.debug(`Error checking for form (attempt ${attempt}): ${getErrorMessage(error)}`);
        }

        logger.info(`User form not found, retrying... (${attempt}/${FORM_RETRY_ATTEMPTS})`);
        await delay(TIMEOUTS.formRetry);
    }

    return false;
}

async function typeIfExists(page: Page, selector: string, value: string): Promise<boolean> {
    const element = await page.$(selector);
    if (element) {
        await page.click(selector, { clickCount: 3 }); // Triple-click to select all
        await page.type(selector, value);
        return true;
    }
    return false;
}

// ==================== ENHANCED SITE SELECTION (FROM DEVICE SERVICE) ====================

/**
 * Robust site selection with multiple fallback strategies
 * Mirrors the device service implementation
 */
async function selectSite(page: Page, siteName: string): Promise<boolean> {
    logger.info(`🔍 Selecting site: ${siteName}`);

    // Debug: capture form state
    const formState = await page.evaluate(() => {
        const siteWrapper = document.querySelector('#site')?.closest('.ant-select');
        const siteInput = document.querySelector('#site');
        return {
            siteWrapperExists: !!siteWrapper,
            siteWrapperClass: siteWrapper?.className || 'N/A',
            siteInputExists: !!siteInput,
            siteInputTag: siteInput?.tagName || 'N/A',
            allSelectsOnPage: document.querySelectorAll('.ant-select').length,
            allDropdownsOnPage: document.querySelectorAll('.ant-select-dropdown').length,
        };
    });
    logger.debug(`Form state: ${JSON.stringify(formState, null, 2)}`);

    // Strategy 1: Find and click the Ant Design wrapper
    const siteSelectWrapper = await page.$('#site').then(async (el: any) =>
        el ? await el.evaluateHandle((e: Element) => e.closest('.ant-select')) : null
    );

    if (siteSelectWrapper) {
        await siteSelectWrapper.click();
        logger.info('✅ Clicked site select wrapper');
    } else {
        // Fallback: click directly on #site
        const siteElement = await page.$(SELECTORS.site);
        if (siteElement) {
            await siteElement.click();
            logger.info('✅ Clicked #site directly (fallback)');
        } else {
            logger.error('❌ Site field not found');
            return false;
        }
    }

    await delay(1000);

    // Check for dropdown visibility
    const dropdownState = await page.evaluate(() => {
        const dropdowns = document.querySelectorAll('.ant-select-dropdown');
        const visibleDropdowns = Array.from(dropdowns).filter(
            (d) =>
                !d.classList.contains('ant-select-dropdown-hidden') &&
                (d as HTMLElement).offsetParent !== null
        );
        return {
            totalDropdowns: dropdowns.length,
            visibleDropdowns: visibleDropdowns.length,
            dropdownClasses: Array.from(dropdowns).map((d) => d.className),
            options:
                visibleDropdowns.length > 0
                    ? Array.from(
                        visibleDropdowns[0].querySelectorAll('.ant-select-item-option')
                    ).map((o) => o.textContent?.trim())
                    : [],
        };
    });
    logger.debug(`Dropdown state: ${JSON.stringify(dropdownState, null, 2)}`);

    // Strategy 2: Keyboard navigation if dropdown not visible
    if (dropdownState.visibleDropdowns === 0) {
        logger.warn('⚠️ No visible dropdown, trying keyboard navigation...');
        await page.focus(SELECTORS.site);
        await page.keyboard.press('Space');
        await delay(500);
        await page.keyboard.press('ArrowDown');
        await delay(1000);

        // Re-check dropdown state
        const retryState = await page.evaluate(() => {
            const dropdowns = document.querySelectorAll('.ant-select-dropdown');
            const visibleDropdowns = Array.from(dropdowns).filter(
                (d) => !d.classList.contains('ant-select-dropdown-hidden')
            );
            return {
                visibleDropdowns: visibleDropdowns.length,
                options:
                    visibleDropdowns.length > 0
                        ? Array.from(
                            visibleDropdowns[0].querySelectorAll('.ant-select-item-option')
                        ).map((o) => o.textContent?.trim())
                        : [],
            };
        });
        logger.debug(`Retry dropdown state: ${JSON.stringify(retryState, null, 2)}`);
    }

    // Strategy 3: Select the option
    const siteSelected = await page.evaluate((targetSite: string) => {
        const options = document.querySelectorAll('.ant-select-item-option');
        for (const option of Array.from(options)) {
            const text = option.textContent?.trim().toLowerCase();
            if (text === targetSite.toLowerCase()) {
                (option as HTMLElement).click();
                return { success: true, selected: option.textContent?.trim() };
            }
        }
        return {
            success: false,
            available: Array.from(options).map((o) => o.textContent?.trim()),
        };
    }, siteName);

    if (siteSelected.success) {
        logger.info(`✅ Site selected: ${siteSelected.selected}`);
        await delay(500);
        return true;
    } else {
        logger.warn(`⚠️ Site not found. Available options: ${JSON.stringify(siteSelected.available)}`);
        await captureScreenshot(page, 'site-selection-failed.png');
        return false;
    }
}

// ==================== ROLE SELECTION ====================

async function findRoleFieldByXPath(page: Page): Promise<ElementHandle | null> {
    try {
        const xpath = '//label[contains(text(), "Role")]/../..//div[contains(@class, "ant-select")]';
        const locator = page.locator(`::-p-xpath(${xpath})`).setTimeout(TIMEOUTS.dropdown);
        const handle = await locator.waitHandle();
        return handle.asElement() as ElementHandle<Element> | null;
    } catch {
        logger.debug('Could not find role field by XPath');
        return null;
    }
}

async function selectRole(page: Page, role: VivalinkRole = 'Physician'): Promise<boolean> {
    logger.info(`Selecting role: ${role}`);

    let roleField: ElementHandle | null = await page.$(SELECTORS.role);

    if (!roleField) {
        logger.info('#role not found, attempting to find by Label...');
        roleField = await findRoleFieldByXPath(page);
    }

    if (!roleField) {
        logger.error('Could not find ROLE field!');
        await captureScreenshot(page, 'role-missing.png');
        return false;
    }

    try {
        await roleField.click();
    } catch (error) {
        logger.error(`Error clicking role field: ${getErrorMessage(error)}`);
        return false;
    }

    try {
        await page.waitForSelector(SELECTORS.dropdown, { timeout: TIMEOUTS.dropdown });
        await delay(500);
    } catch {
        logger.warn('Role dropdown wait timeout, trying to proceed...');
    }

    const roleOption = await page.evaluateHandle((targetRole: string) => {
        const selector = '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option';
        const options = Array.from(document.querySelectorAll(selector));
        return options.find((opt) => opt.textContent?.trim() === targetRole) ?? null;
    }, role);

    const element = roleOption.asElement() as ElementHandle<Element> | null;
    if (element) {
        await element.click();
        logger.info(`Clicked "${role}" option`);
        await delay(500);
        await page.keyboard.press('Escape');
        await delay(200);
        return true;
    }

    logger.warn('Could not find role option, attempting text input fallback...');
    try {
        await page.type(SELECTORS.role, role);
        await delay(1000);
        await page.keyboard.press('Enter');
        return true;
    } catch {
        return false;
    }
}

// ==================== FORM SUBMISSION ====================

async function submitFormAndWaitForResult(page: Page): Promise<SubmissionResult> {
    logger.info('Submitting form...');

    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const submitButton = buttons.find(
            (btn) =>
                btn.textContent &&
                ['Save', 'Submit', 'Add', 'Create'].some((text) =>
                    btn.textContent?.includes(text)
                )
        );
        if (submitButton) {
            (submitButton as HTMLButtonElement).click();
        }
    });

    logger.info('Waiting for success message or navigation...');

    const navigationPromise = page
        .waitForNavigation({ timeout: TIMEOUTS.submission })
        .then((): SubmissionResult => 'navigation')
        .catch(() => null);

    const successPromise = page
        .waitForSelector(SELECTORS.successMessage, { timeout: TIMEOUTS.submission })
        .then((): SubmissionResult => 'success')
        .catch(() => null);

    const errorPromise = page
        .waitForSelector(SELECTORS.formError, { timeout: TIMEOUTS.submission })
        .then((): SubmissionResult => 'validation_error')
        .catch(() => null);

    const timeoutPromise = delay(TIMEOUTS.submission + 5000).then(
        (): SubmissionResult => 'timeout'
    );

    const result = await Promise.race([
        navigationPromise,
        successPromise,
        errorPromise,
        timeoutPromise,
    ]);

    logger.info(`Submission result: ${result}`);
    return result;
}

// ==================== MAIN FUNCTION ====================

async function addDoctor(doctorData: VivalinkDoctorData): Promise<VivalinkSyncResult> {
    const session = await login();
    if (!session) {
        return {
            success: false,
            error: 'Failed to login to Vivalink portal',
        };
    }

    const { browser, page } = session;

    try {
        logger.info('Navigating to user management add page...');
        await page.goto(`${PORTAL_CONFIG.url}/user-management/add`, {
            waitUntil: 'networkidle0',
            timeout: TIMEOUTS.navigation * 2,
        });

        logger.debug(`Current URL: ${page.url()}`);

        const formFound = await waitForForm(page);
        if (!formFound) {
            logger.error('Form not found after retries');
            await captureScreenshot(page, 'form-not-found.png');
            await closeBrowser(browser);
            return {
                success: false,
                error: 'User form not found after multiple retries',
            };
        }

        logger.info(`Filling form for ${doctorData.firstName} ${doctorData.lastName}`);

        // Fill required fields
        logger.info('Typing email...');
        await typeIfExists(page, SELECTORS.email, doctorData.email);

        if (doctorData.phoneNumber) {
            logger.info('Typing phone...');
            await typeIfExists(page, SELECTORS.phone, doctorData.phoneNumber);
        }

        await typeIfExists(page, SELECTORS.firstName, doctorData.firstName);
        await typeIfExists(page, SELECTORS.lastName, doctorData.lastName ?? '');

        if (doctorData.position) {
            await typeIfExists(page, SELECTORS.position, doctorData.position);
        }

        // Use enhanced site selection
        if (doctorData.site) {
            const siteSelected = await selectSite(page, doctorData.site);
            if (!siteSelected) {
                logger.warn('Site selection failed, but continuing...');
            }
        }

        // Select role
        const roleSelected = await selectRole(page, doctorData.role ?? 'Physician');
        if (!roleSelected) {
            logger.warn('Role selection may have failed, continuing anyway...');
        }

        // Submit form
        const result = await submitFormAndWaitForResult(page);

        // Handle result
        switch (result) {
            case 'timeout': {
                logger.error('Timeout waiting for submission result');
                await captureScreenshot(page, 'submission-timeout.png');
                const errorText = await extractPageErrors(page);
                await closeBrowser(browser);
                return {
                    success: false,
                    error: `Timeout while adding physician. Page errors: ${errorText || 'None visible'}`,
                };
            }

            case 'validation_error': {
                logger.error('Validation error detected');
                await captureScreenshot(page, 'validation-error.png');
                const errorText = await extractPageErrors(page);
                await closeBrowser(browser);
                return {
                    success: false,
                    error: `Validation error: ${errorText}`,
                };
            }

            case 'navigation':
            case 'success': {
                await closeBrowser(browser);
                return { success: true };
            }

            default: {
                await closeBrowser(browser);
                return {
                    success: false,
                    error: 'Unexpected result during form submission',
                };
            }
        }
    } catch (error) {
        logger.error('Error adding physician to Vivalink', error);
        await captureScreenshot(page, 'exception-error.png');
        await closeBrowser(browser);
        return {
            success: false,
            error: getErrorMessage(error),
        };
    }
}

// ==================== EXPORTS ====================

export {
    addDoctor,
    login,
    closeBrowser,
    VivalinkDoctorData,
    VivalinkSyncResult,
    VivalinkRole,
    BrowserSession,
};

// ==================== MAIN EXECUTION ====================

async function run(): Promise<void> {
    console.log('--- Starting Doctor Addition Test (Standalone) ---');

    const randomId = Math.floor(Math.random() * 10000);
    const doctorData: VivalinkDoctorData = {
        firstName: 'Test',
        lastName: `Doctor${randomId}`,
        email: `test.doctor${randomId}@example.com`,
        phoneNumber: '1234567890',
        position: 'Doctor',
        site: 'Pakistan',
        role: 'Physician',
    };

    console.log('Test Data:', doctorData);

    const result = await addDoctor(doctorData);

    if (result.success) {
        console.log('\n✅ TEST PASSED: Doctor added successfully!');
    } else {
        console.error(`\n❌ TEST FAILED: ${result.error}`);
        process.exit(1);
    }
}

run();