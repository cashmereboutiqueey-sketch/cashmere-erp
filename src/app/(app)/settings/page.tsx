
'use client';

import { PageHeader, PageHeaderHeading } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsPage() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Settings</PageHeaderHeading>
      </PageHeader>
      <div className="p-4 lg:p-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>
                  Update your company's profile information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" placeholder="Cashmere" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Address</Label>
                  <Textarea
                    id="company-address"
                    placeholder="123 Fashion Ave, Style City, 12345"
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="company-email">Contact Email</Label>
                  <Input id="company-email" type="email" placeholder="contact@cashmere.com" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Shopify Integration</CardTitle>
                <CardDescription>
                  Connect your Shopify store to sync products and orders.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shopify-url">Shopify Store URL</Label>
                  <Input
                    id="shopify-url"
                    placeholder="your-store.myshopify.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopify-api-key">API Key</Label>
                  <Input id="shopify-api-key" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopify-api-secret">API Secret Key</Label>
                  <Input id="shopify-api-secret" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Connect to Shopify</Button>
              </CardFooter>
            </Card>
          </TabsContent>
           <TabsContent value="users">
             <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                    User Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                    This feature is under construction.
                    </p>
                </div>
            </div>
           </TabsContent>
            <TabsContent value="notifications">
             <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                    Notification Settings
                    </h3>
                    <p className="text-sm text-muted-foreground">
                    This feature is under construction.
                    </p>
                </div>
            </div>
           </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
