"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { OnboardingStrip } from "@/components/onboarding-strip";
import { ScreenShell } from "@/components/screen-shell";
import { type BrandProfile, loadBrandProfile } from "@/lib/brand-profile";

import { BrandForm } from "./_components/brand-form";
import { BrandPreview } from "./_components/brand-preview";

const initialProfile: BrandProfile = {
	name: "Acme Engineering",
	voice:
		"Technical but with humor. We hate marketing bullshit and write like engineers talk on Twitter — direct, slightly sarcastic, never corporate. We're skeptical of hype and love showing real numbers. When we ship something, we explain it like we're explaining to a friend who codes.",
	tone: {
		formalCasual: 75,
		seriousPlayful: 60,
		directStorytelling: 25,
	},
};

export default function BrandSetupPage() {
	const router = useRouter();
	const [profile, setProfile] = useState<BrandProfile>(initialProfile);

	useEffect(() => {
		const existing = loadBrandProfile();
		if (existing) {
			setProfile(existing);
		}
	}, []);

	function handleSkip() {
		router.push("/source" as Route);
	}

	return (
		<ScreenShell
			topStrip={
				<OnboardingStrip
					step="Step 1 of 1"
					label="Set up your brand"
					onSkip={handleSkip}
				/>
			}
		>
			<main className="mx-auto grid w-full max-w-[1280px] grid-cols-[720px_360px] gap-10 px-20 pt-20 pb-24">
				<BrandForm profile={profile} onChange={setProfile} />
				<BrandPreview profile={profile} />
			</main>
		</ScreenShell>
	);
}
