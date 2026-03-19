import { FAQList } from "./components/faq-list"
import { FeaturesGrid } from "./components/features-grid"
import { BookOpen } from "lucide-react"

// Import data
import categoriesData from "./data/categories.json"
import faqsData from "./data/faqs.json"
import featuresData from "./data/features.json"

export default function FAQsPage() {
  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="size-6 text-primary" />
          Help &amp; Documentation
        </h1>
        <p className="text-muted-foreground">
          Everything you need to know about NanoToxi AI — the pipeline, interpreting results, the API, and your account.
        </p>
      </div>
      <FAQList faqs={faqsData} categories={categoriesData} />
      <FeaturesGrid features={featuresData} />
    </div>
  )
}
