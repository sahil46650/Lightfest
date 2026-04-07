'use client';

/**
 * Personal Information Form Component
 *
 * Uses react-hook-form with Zod validation for the personal info step.
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { personalInfoSchema, type PersonalInfo } from '../schemas';

// ============================================================================
// Types
// ============================================================================

export interface PersonalInfoFormProps {
  /**
   * Default values to pre-fill the form.
   */
  defaultValues?: Partial<PersonalInfo>;

  /**
   * Callback when form is submitted successfully.
   */
  onSubmit: (data: PersonalInfo) => void | Promise<void>;

  /**
   * Whether the form is in a loading/submitting state.
   */
  isLoading?: boolean;

  /**
   * Whether to show the "Create account" option.
   */
  showAccountOption?: boolean;

  /**
   * Label for the submit button.
   */
  submitLabel?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PersonalInfoForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  showAccountOption = true,
  submitLabel = 'Continue to Attendees',
}: PersonalInfoFormProps) {
  const form = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      email: defaultValues?.email ?? '',
      firstName: defaultValues?.firstName ?? '',
      lastName: defaultValues?.lastName ?? '',
      phone: defaultValues?.phone ?? '',
      countryCode: defaultValues?.countryCode ?? '+1',
      createAccount: defaultValues?.createAccount ?? false,
      password: defaultValues?.password ?? '',
    },
  });

  const watchCreateAccount = form.watch('createAccount');

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Your confirmation and tickets will be sent here.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" autoComplete="given-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" autoComplete="family-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  autoComplete="tel"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                For event updates and emergencies only.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Create Account Option */}
        {showAccountOption && (
          <>
            <FormField
              control={form.control}
              name="createAccount"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Create an account</FormLabel>
                    <FormDescription>
                      Save your info for faster checkout and view your order history.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Password (conditional) */}
            {watchCreateAccount && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
